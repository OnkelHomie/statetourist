from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Body
from fastapi.responses import RedirectResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import urllib.parse
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import json
import httpx
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# --- MongoDB ---
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# --- Config ---
STATEV_API_BASE = os.environ.get('STATEV_API_BASE', '').rstrip('/')
STATEV_API_KEY = os.environ.get('STATEV_API_KEY', '')
STATEV_API_SECRET = os.environ.get('STATEV_API_SECRET', '')
STATEV_FIRMA_ID = os.environ.get('STATEV_FIRMA_ID', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev_secret')
PUBLIC_BASE_URL = os.environ.get('PUBLIC_BASE_URL', '').rstrip('/')
ADMIN_BASE_URL = (os.environ.get('ADMIN_BASE_URL', '') or PUBLIC_BASE_URL).rstrip('/')
DISCORD_CLIENT_ID = os.environ.get('DISCORD_CLIENT_ID', '')
DISCORD_CLIENT_SECRET = os.environ.get('DISCORD_CLIENT_SECRET', '')
ADMIN_DISCORD_IDS = [s.strip() for s in os.environ.get('ADMIN_DISCORD_IDS', '').split(',') if s.strip()]
DISCORD_REDIRECT_URI = f"{PUBLIC_BASE_URL}/api/auth/discord/callback"
COOKIE_NAME = "sv_admin"
PUBLIC_DIR = Path("/app/frontend/public")

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# ======================================================================
#  StateV vAPI proxy helper
# ======================================================================
async def sv_get(path: str):
    """GET against StateV vAPI. Returns dict. Premium-locked endpoints
    return {"_premium": True, "message": ...} instead of raising."""
    if not STATEV_API_KEY or not STATEV_API_BASE:
        raise HTTPException(status_code=503, detail="StateV API ist nicht konfiguriert.")
    url = f"{STATEV_API_BASE}/{path.lstrip('/')}"
    headers = {"Authorization": f"Bearer {STATEV_API_KEY}", "Accept": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=20) as cx:
            r = await cx.get(url, headers=headers)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"StateV API nicht erreichbar: {e}")
    try:
        data = r.json()
    except Exception:
        data = {"raw": r.text}
    if r.status_code == 401 and isinstance(data, dict) and "Premium" in str(data.get("message", "")):
        return {"_premium": True, "message": data.get("message")}
    if r.status_code == 404 and isinstance(data, dict) and "empty" in str(data.get("message", "")).lower():
        return {}
    if r.status_code >= 400:
        msg = data.get("message") if isinstance(data, dict) else str(data)
        raise HTTPException(status_code=r.status_code, detail=msg or "StateV API Fehler")
    return data

async def sv_post(path: str, payload: dict):
    if not STATEV_API_KEY or not STATEV_API_BASE:
        raise HTTPException(status_code=503, detail="StateV API ist nicht konfiguriert.")
    url = f"{STATEV_API_BASE}/{path.lstrip('/')}"
    headers = {"Authorization": f"Bearer {STATEV_API_KEY}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=20) as cx:
            r = await cx.post(url, headers=headers, json=payload)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"StateV API nicht erreichbar: {e}")
    try:
        data = r.json()
    except Exception:
        data = {"raw": r.text}
    if r.status_code >= 400:
        msg = data.get("message") if isinstance(data, dict) else str(data)
        raise HTTPException(status_code=r.status_code, detail=msg or "StateV API Fehler")
    return data

# ======================================================================
#  Auth (Discord OAuth2 -> JWT cookie, restricted to allowlist)
# ======================================================================
def make_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "username": user.get("username"),
        "global_name": user.get("global_name"),
        "avatar": user.get("avatar"),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Nicht angemeldet.")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Sitzung ungültig oder abgelaufen.")
    if ADMIN_DISCORD_IDS and payload.get("sub") not in ADMIN_DISCORD_IDS:
        raise HTTPException(status_code=403, detail="Kein Admin-Zugriff.")
    return payload

@api_router.get("/auth/config")
async def auth_config():
    return {"configured": bool(DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET and PUBLIC_BASE_URL)}

@api_router.get("/auth/login")
async def auth_login():
    if not (DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET and PUBLIC_BASE_URL):
        raise HTTPException(status_code=503, detail="Discord-Login ist noch nicht konfiguriert.")
    params = {
        "client_id": DISCORD_CLIENT_ID,
        "redirect_uri": DISCORD_REDIRECT_URI,
        "response_type": "code",
        "scope": "identify",
        "prompt": "consent",
    }
    return RedirectResponse(url="https://discord.com/oauth2/authorize?" + urllib.parse.urlencode(params))

@api_router.get("/auth/discord/callback")
async def auth_callback(code: Optional[str] = None, error: Optional[str] = None):
    admin_url = f"{ADMIN_BASE_URL}/admin.html"
    if error or not code:
        return RedirectResponse(url=f"{admin_url}?error=denied")
    token_data = {
        "client_id": DISCORD_CLIENT_ID,
        "client_secret": DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": DISCORD_REDIRECT_URI,
    }
    async with httpx.AsyncClient(timeout=20) as cx:
        tr = await cx.post("https://discord.com/api/oauth2/token", data=token_data,
                           headers={"Content-Type": "application/x-www-form-urlencoded"})
        if tr.status_code != 200:
            return RedirectResponse(url=f"{admin_url}?error=token")
        access = tr.json().get("access_token")
        ur = await cx.get("https://discord.com/api/users/@me",
                          headers={"Authorization": f"Bearer {access}"})
        if ur.status_code != 200:
            return RedirectResponse(url=f"{admin_url}?error=user")
        user = ur.json()
    if ADMIN_DISCORD_IDS and user.get("id") not in ADMIN_DISCORD_IDS:
        return RedirectResponse(url=f"{admin_url}?error=forbidden")
    token = make_token(user)
    resp = RedirectResponse(url=admin_url)
    resp.set_cookie(COOKIE_NAME, token, httponly=True, secure=True, samesite="none", max_age=7 * 24 * 3600, path="/")
    return resp

@api_router.get("/auth/me")
async def auth_me(admin: dict = Depends(get_current_admin)):
    return {"id": admin.get("sub"), "username": admin.get("username"),
            "global_name": admin.get("global_name"), "avatar": admin.get("avatar")}

@api_router.post("/auth/logout")
async def auth_logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}

# ======================================================================
#  Firma (factory) endpoints — admin only
# ======================================================================
@api_router.get("/firma/overview")
async def firma_overview(admin: dict = Depends(get_current_admin)):
    data = await sv_get("factory/list/")
    current = None
    if isinstance(data, list):
        for f in data:
            if f.get("id") == STATEV_FIRMA_ID:
                current = f
                break
        if current is None and data:
            current = data[0]
    return {"firmaId": STATEV_FIRMA_ID, "current": current, "all": data}

@api_router.get("/firma/inventory")
async def firma_inventory(admin: dict = Depends(get_current_admin)):
    return await sv_get(f"factory/inventory/{STATEV_FIRMA_ID}")

@api_router.get("/firma/machine")
async def firma_machine(admin: dict = Depends(get_current_admin)):
    return await sv_get(f"factory/machine/{STATEV_FIRMA_ID}")

@api_router.get("/firma/counter")
async def firma_counter(admin: dict = Depends(get_current_admin)):
    return await sv_get(f"factory/counter/{STATEV_FIRMA_ID}")

@api_router.get("/firma/productions")
async def firma_productions(admin: dict = Depends(get_current_admin)):
    return await sv_get(f"factory/productions/{STATEV_FIRMA_ID}")

@api_router.get("/firma/vehicles")
async def firma_vehicles(admin: dict = Depends(get_current_admin)):
    return await sv_get(f"factory/vehicles/{STATEV_FIRMA_ID}")

@api_router.get("/firma/marketoffers")
async def firma_marketoffers(admin: dict = Depends(get_current_admin)):
    sell = await sv_get(f"factory/marketoffers/sell/{STATEV_FIRMA_ID}")
    buy = await sv_get(f"factory/marketoffers/buy/{STATEV_FIRMA_ID}")
    return {"sell": sell, "buy": buy}

@api_router.get("/firma/buylog")
async def firma_buylog(limit: int = 25, skip: int = 0, admin: dict = Depends(get_current_admin)):
    return await sv_get(f"factory/buyLog/{STATEV_FIRMA_ID}/{limit}/{skip}")

@api_router.get("/firma/bankaccounts")
async def firma_bankaccounts(admin: dict = Depends(get_current_admin)):
    return await sv_get(f"factory/bankaccounts/{STATEV_FIRMA_ID}")

@api_router.get("/firma/transactions/{bank_id}")
async def firma_transactions(bank_id: str, limit: int = 25, offset: int = 0, admin: dict = Depends(get_current_admin)):
    return await sv_get(f"factory/transactions/{bank_id}/{limit}/{offset}")

@api_router.get("/firma/options/{option}")
async def firma_options_get(option: str, admin: dict = Depends(get_current_admin)):
    return await sv_get(f"factory/options/{STATEV_FIRMA_ID}/{option}")

@api_router.post("/firma/options")
async def firma_options_set(payload: dict = Body(...), admin: dict = Depends(get_current_admin)):
    if not STATEV_API_SECRET:
        raise HTTPException(status_code=503, detail="API-Secret fehlt. Bitte STATEV_API_SECRET im Backend hinterlegen.")
    try:
        opt = int(payload.get("option"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="option muss eine Ganzzahl (1–10) sein.")
    body = {"apiSecret": STATEV_API_SECRET, "factoryId": STATEV_FIRMA_ID, "option": opt,
            "title": str(payload.get("title", ""))[:64], "data": str(payload.get("data", ""))[:2400]}
    return await sv_post("factory/options", body)

# ======================================================================
#  Buildings (Immobilien) — admin only
# ======================================================================
@api_router.get("/firma/optionslots")
async def firma_optionslots(admin: dict = Depends(get_current_admin)):
    slots = []
    used = 0
    for n in range(1, 11):
        try:
            d = await sv_get(f"factory/options/{STATEV_FIRMA_ID}/{n}")
        except HTTPException:
            d = {}
        if not isinstance(d, dict):
            d = {}
        data = d.get("data")
        is_used = bool(data)
        if is_used:
            used += 1
        slots.append({"slot": n, "used": is_used, "title": d.get("title") or "",
                      "length": len(data) if data else 0, "lastUpdated": d.get("lastUpdated")})
    return {"total": 10, "used": used, "slots": slots}

@api_router.get("/buildings")
async def buildings_list(admin: dict = Depends(get_current_admin)):
    return await sv_get("building/list")

@api_router.get("/buildings/{building_id}/details")
async def building_details(building_id: str, admin: dict = Depends(get_current_admin)):
    return await sv_get(f"building/details/{building_id}")

@api_router.get("/buildings/{building_id}/tenants")
async def building_tenants(building_id: str, admin: dict = Depends(get_current_admin)):
    return await sv_get(f"building/tenants/{building_id}")

@api_router.get("/buildings/{building_id}/rooms")
async def building_rooms(building_id: str, admin: dict = Depends(get_current_admin)):
    return await sv_get(f"building/rooms/{building_id}")

@api_router.get("/buildings/{building_id}/bankaccounts")
async def building_bankaccounts(building_id: str, admin: dict = Depends(get_current_admin)):
    return await sv_get(f"building/bankaccounts/{building_id}")

# ======================================================================
#  Website CMS (Events / News / Gallery) — GET public, mutations admin
# ======================================================================
VALID_KINDS = {"events", "news", "gallery", "sights", "places", "jobs", "companies", "freizeit"}

def _strip_id(doc):
    doc = dict(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/content/{kind}")
async def content_list(kind: str):
    if kind not in VALID_KINDS:
        raise HTTPException(status_code=404, detail="Unbekannter Inhaltstyp.")
    docs = await db[f"content_{kind}"].find({}).sort("order", 1).to_list(500)
    return [_strip_id(d) for d in docs]

@api_router.post("/content/{kind}")
async def content_create(kind: str, payload: dict = Body(...), admin: dict = Depends(get_current_admin)):
    if kind not in VALID_KINDS:
        raise HTTPException(status_code=404, detail="Unbekannter Inhaltstyp.")
    item = dict(payload)
    item["id"] = str(uuid.uuid4())
    if "order" not in item:
        item["order"] = await db[f"content_{kind}"].count_documents({})
    item["updatedAt"] = datetime.now(timezone.utc).isoformat()
    await db[f"content_{kind}"].insert_one(dict(item))
    return _strip_id(item)

@api_router.put("/content/{kind}/{item_id}")
async def content_update(kind: str, item_id: str, payload: dict = Body(...), admin: dict = Depends(get_current_admin)):
    if kind not in VALID_KINDS:
        raise HTTPException(status_code=404, detail="Unbekannter Inhaltstyp.")
    update = dict(payload)
    update.pop("id", None)
    update.pop("_id", None)
    update["updatedAt"] = datetime.now(timezone.utc).isoformat()
    res = await db[f"content_{kind}"].update_one({"id": item_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden.")
    doc = await db[f"content_{kind}"].find_one({"id": item_id})
    return _strip_id(doc)

@api_router.delete("/content/{kind}/{item_id}")
async def content_delete(kind: str, item_id: str, admin: dict = Depends(get_current_admin)):
    if kind not in VALID_KINDS:
        raise HTTPException(status_code=404, detail="Unbekannter Inhaltstyp.")
    res = await db[f"content_{kind}"].delete_one({"id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden.")
    return {"ok": True}

# ======================================================================
#  Seed default CMS content (idempotent)
# ======================================================================
DEFAULT_EVENTS = [
    {"cat": "Sport", "day": "14", "mon": "Jun", "title": "Street Race", "text": "Illegales Straßenrennen durch die Innenstadt – nur für Mutige mit schnellen Autos.", "time": "22:00 Uhr", "place": "Hafenviertel"},
    {"cat": "Nightlife", "day": "15", "mon": "Jun", "title": "Clubabend im Vanilla Unicorn", "text": "Die heißeste Nacht der Woche mit Live-DJ und Specials an der Bar.", "time": "23:00 Uhr", "place": "Strawberry"},
    {"cat": "Sport", "day": "16", "mon": "Jun", "title": "Angelturnier am Pier", "text": "Wer fängt den größten Fisch? Anmeldung vor Ort, tolle Preise.", "time": "09:00 Uhr", "place": "Del Perro Pier"},
    {"cat": "Sport", "day": "18", "mon": "Jun", "title": "Boxevent", "text": "Die besten Kämpfer der Stadt treten im Ring gegeneinander an.", "time": "20:00 Uhr", "place": "Vespucci Arena"},
    {"cat": "Markt", "day": "20", "mon": "Jun", "title": "Markttag", "text": "Regionale Produkte, Handgemachtes und Schnäppchen auf dem großen Wochenmarkt.", "time": "10:00 Uhr", "place": "Legion Square"},
    {"cat": "Nightlife", "day": "21", "mon": "Jun", "title": "Casino Gala-Nacht", "text": "Eleganter Abend mit Dresscode, Roulette und Live-Musik.", "time": "21:00 Uhr", "place": "Diamond Casino"},
]
DEFAULT_NEWS = [
    {"tag": "mayor", "tagLabel": "Bürgermeister", "feature": True, "title": "Großoffensive für saubere Straßen gestartet", "text": "Bürgermeister Alvarez kündigt ein Investitionspaket für Parks, Beleuchtung und den Ausbau des Nahverkehrs an. „Los Santos soll für jeden lebenswert sein.“", "meta": "Heute · Rathaus"},
    {"tag": "news", "tagLabel": "Stadt-News", "title": "Neuer Strandabschnitt am Del Perro eröffnet", "text": "Mehr Platz zum Verweilen, neue Promenade und Foodtrucks.", "meta": "Vor 2 Std."},
    {"tag": "police", "tagLabel": "Polizei", "title": "Verkehrskontrollen am Highway", "text": "Das LSPD bittet um vorsichtige Fahrweise auf der Route 68.", "meta": "Vor 4 Std."},
    {"tag": "event", "tagLabel": "Event", "title": "Street Race am Wochenende", "text": "Die Tuning-Szene trifft sich Samstagnacht im Hafenviertel.", "meta": "Morgen"},
    {"tag": "news", "tagLabel": "Stadt-News", "title": "Maze Bank Tower mit neuer Aussichtsplattform", "text": "Ab sofort öffentlich zugänglich – der beste Blick über die Stadt.", "meta": "Gestern"},
]
DEFAULT_GALLERY = [
    {"img": "hero", "cap": "Skyline bei Sonnenuntergang", "ar": 1.5},
    {"img": "vinewood", "cap": "Vinewood Sign", "ar": 1},
    {"img": "pier", "cap": "Del Perro Pier", "ar": 1},
    {"grad": "linear-gradient(135deg,#f5b942,#ef6f5e)", "cap": "Goldene Stunde", "ar": 1.3},
    {"img": "observatory", "cap": "Observatory bei Nacht", "ar": 1},
    {"img": "casino", "cap": "Diamond Casino", "ar": 1},
    {"grad": "linear-gradient(135deg,#36d6c6,#2aa7c2)", "cap": "Küstenstraße", "ar": 0.8},
    {"img": "mazebank", "cap": "Maze Bank Tower", "ar": 1},
    {"img": "harbor", "cap": "Der Hafen", "ar": 1},
    {"grad": "linear-gradient(135deg,#6f9bff,#8a7dff)", "cap": "Nachtleben", "ar": 1.2},
    {"img": "golf", "cap": "GWC Golfplatz", "ar": 1},
    {"img": "airport", "cap": "Flughafen LSIA", "ar": 1},
]

DEFAULT_SIGHTS = [
    {"img": "vinewood", "cat": "Wahrzeichen", "title": "Vinewood Sign", "desc": "Der berühmte Schriftzug hoch über der Stadt – das beste Fotomotiv."},
    {"img": "pier", "cat": "Strand", "title": "Del Perro Pier", "desc": "Riesenrad, Spielhallen und Sonnenuntergänge am Meer."},
    {"img": "observatory", "cat": "Aussicht", "title": "Galileo Observatory", "desc": "Sterne beobachten und über den Lichtern der Stadt schweben."},
    {"img": "casino", "cat": "Entertainment", "title": "Diamond Casino", "desc": "Glanz, Glamour und das große Glück mitten in Vinewood."},
    {"img": "mazebank", "cat": "Architektur", "title": "Maze Bank Tower", "desc": "Das höchste Gebäude der Stadt mit Aussichtsplattform."},
    {"img": "airport", "cat": "Verkehr", "title": "Flughafen LSIA", "desc": "Das Tor zur Welt – Ankunftspunkt für alle Neuankömmlinge."},
    {"img": "harbor", "cat": "Industrie", "title": "Hafen von Los Santos", "desc": "Wo Fracht und Geschichten aus aller Welt anlanden."},
    {"img": "golf", "cat": "Freizeit", "title": "GWC Golfplatz", "desc": "Gepflegte Greens für eine entspannte Runde unter Palmen."},
]
DEFAULT_PLACES = [
    {"cat": "krankenhaus", "icon": "cross", "title": "Pillbox Hill Medical", "desc": "Zentrales Krankenhaus mit Notaufnahme rund um die Uhr.", "loc": "Pillbox Hill", "hours": "24 Stunden geöffnet"},
    {"cat": "polizei", "icon": "shield", "title": "LSPD Mission Row", "desc": "Hauptrevier des Los Santos Police Department.", "loc": "Mission Row", "hours": "24 Stunden besetzt"},
    {"cat": "feuerwehr", "icon": "flame", "title": "Feuerwache Davis", "desc": "Brandbekämpfung und Rettungsdienst für den Süden.", "loc": "Davis", "hours": "24 Stunden einsatzbereit"},
    {"cat": "rathaus", "icon": "landmark", "title": "Rathaus Los Santos", "desc": "Personalausweis, Anmeldungen und Bürgerservice.", "loc": "Vinewood Blvd.", "hours": "Mo–Fr 08:00–20:00"},
    {"cat": "arbeitsamt", "icon": "briefcase", "title": "Arbeitsamt", "desc": "Anmeldung für alle städtischen Jobs und Berufe.", "loc": "Legion Square", "hours": "Täglich 07:00–22:00"},
    {"cat": "bank", "icon": "coins", "title": "Fleeca Bank", "desc": "Bankkonto eröffnen, Geld abheben und Überweisungen.", "loc": "Innenstadt", "hours": "Mo–Sa 09:00–18:00"},
    {"cat": "tankstelle", "icon": "fuel", "title": "LTD Tankstelle", "desc": "Kraftstoff, Snacks und kleine Einkäufe.", "loc": "Mehrere Standorte", "hours": "24 Stunden geöffnet"},
    {"cat": "garage", "icon": "warehouse", "title": "Zentralgarage", "desc": "Hier holst du deine Fahrzeuge ab und stellst sie ab.", "loc": "Innenstadt & Bezirke", "hours": "Immer zugänglich"},
    {"cat": "shop", "icon": "bag", "title": "24/7 Supermarkt", "desc": "Lebensmittel, Getränke und Alltagsbedarf.", "loc": "Stadtweit", "hours": "24 Stunden geöffnet"},
]
DEFAULT_JOBS = [
    {"icon": "trash", "title": "Müllabfuhr", "desc": "Sammle Müll in der ganzen Stadt ein – ein verlässlicher Einstiegsjob.", "diff": 1, "pay": "€ Niedrig", "beginner": True},
    {"icon": "bus", "title": "Busfahrer", "desc": "Fahre feste Routen ab und bringe Bürger ans Ziel.", "diff": 2, "pay": "€€ Mittel", "beginner": True},
    {"icon": "tram", "title": "Straßenbahnfahrer", "desc": "Steuere die Tram entlang des Schienennetzes der Stadt.", "diff": 2, "pay": "€€ Mittel", "beginner": True},
    {"icon": "car", "title": "Taxifahrer", "desc": "Hole Fahrgäste ab und verdiene am Trinkgeld mit.", "diff": 2, "pay": "€€ Mittel", "beginner": True},
    {"icon": "fish", "title": "Fischer", "desc": "Fahre raus aufs Meer und verkaufe deinen Fang.", "diff": 3, "pay": "€€ Mittel", "beginner": False},
    {"icon": "tractor", "title": "Farmer", "desc": "Bestelle Felder, ernte Pflanzen und versorge die Stadt.", "diff": 2, "pay": "€€ Mittel", "beginner": True},
    {"icon": "axe", "title": "Holzfäller", "desc": "Fälle Bäume im Wald und liefere Holz zum Sägewerk.", "diff": 3, "pay": "€€€ Hoch", "beginner": False},
    {"icon": "pickaxe", "title": "Bergarbeiter", "desc": "Baue Erze in der Mine ab – körperlich anspruchsvoll.", "diff": 4, "pay": "€€€ Hoch", "beginner": False},
    {"icon": "truck", "title": "LKW Fahrer", "desc": "Transportiere Fracht über lange Strecken durch San Andreas.", "diff": 3, "pay": "€€€ Hoch", "beginner": False},
    {"icon": "target", "title": "Jäger", "desc": "Erlege Wild in den Bergen und verkaufe Felle und Fleisch.", "diff": 4, "pay": "€€€ Hoch", "beginner": False},
]
DEFAULT_COMPANIES = [
    {"icon": "utensils", "type": "Gastronomie", "title": "Bayview Restaurant", "desc": "Feine Küche mit Blick aufs Meer – ideal für besondere Anlässe."},
    {"icon": "wrench", "type": "Werkstatt", "title": "LS Customs", "desc": "Tuning, Reparaturen und Lackierungen für jedes Fahrzeug."},
    {"icon": "car", "type": "Autohaus", "title": "Premium Deluxe Motors", "desc": "Vom Kleinwagen bis zum Sportwagen – dein Traumauto wartet."},
    {"icon": "fuel", "type": "Tankstelle", "title": "RON Energie", "desc": "Kraftstoff und Shop-Artikel an Standorten in der ganzen Stadt."},
    {"icon": "bed", "type": "Hotel", "title": "Von Crastenburg Hotel", "desc": "Luxuriöse Zimmer und erstklassiger Service im Herzen der Stadt."},
    {"icon": "music", "type": "Club", "title": "Galaxy Nightclub", "desc": "Der angesagteste Club mit den größten Events der Woche."},
]
DEFAULT_FREIZEIT = [
    {"icon": "dice", "title": "Bowling", "desc": "Strikes mit Freunden im Bowlingcenter.", "long": "Im modernen Bowlingcenter triffst du dich mit Freunden zu entspannten Runden. Mehrere Bahnen, Schuhverleih und eine Bar sorgen für einen gelungenen Abend."},
    {"icon": "dice", "title": "Casino", "desc": "Roulette, Slots und Blackjack im Diamond.", "long": "Das Diamond Casino bietet Roulette, Blackjack, Spielautomaten und ein gehobenes Ambiente. Setze dein Glück aufs Spiel – aber behalte einen kühlen Kopf."},
    {"icon": "wine", "title": "Bars", "desc": "Gemütliche Drinks an stilvollen Theken.", "long": "Über die ganze Stadt verteilt findest du stilvolle Bars – von der ruhigen Cocktailbar bis zur lebhaften Strandbar."},
    {"icon": "music", "title": "Clubs", "desc": "Tanzen bis in die frühen Morgenstunden.", "long": "Die Clubs von Los Santos sind das Herz des Nachtlebens: Live-DJs, Lichtshows und volle Tanzflächen bis zum Morgengrauen."},
    {"icon": "target", "title": "Paintball", "desc": "Taktische Matches in der Paintball-Arena.", "long": "In der Paintball-Arena trittst du in taktischen Team-Matches an. Ausrüstung wird gestellt – Teamgeist bringst du mit."},
    {"icon": "flag", "title": "Rennstrecke", "desc": "Teste deine Rundenzeiten auf dem Kurs.", "long": "Auf der offiziellen Rennstrecke verbesserst du gefahrlos deine Rundenzeiten und nimmst an Zeitrennen teil."},
    {"icon": "film", "title": "Kino", "desc": "Aktuelle Filme auf großer Leinwand.", "long": "Das Kino zeigt wechselnde Filme auf großer Leinwand. Schnapp dir Popcorn und genieße einen entspannten Abend."},
    {"icon": "fish", "title": "Angeln", "desc": "Ruhige Stunden am Wasser mit der Rute.", "long": "Ob am Pier, am See oder auf hoher See – Angeln ist die perfekte Entschleunigung mit lukrativem Fang."},
    {"icon": "mountain", "title": "Wandern", "desc": "Trails durch die Berge von Chiliad.", "long": "Die Trails rund um den Mount Chiliad bieten atemberaubende Ausblicke auf ganz San Andreas."},
]

async def seed_content():
    seeds = {"events": DEFAULT_EVENTS, "news": DEFAULT_NEWS, "gallery": DEFAULT_GALLERY,
             "sights": DEFAULT_SIGHTS, "places": DEFAULT_PLACES, "jobs": DEFAULT_JOBS,
             "companies": DEFAULT_COMPANIES, "freizeit": DEFAULT_FREIZEIT}
    for kind, items in seeds.items():
        coll = db[f"content_{kind}"]
        if await coll.count_documents({}) == 0:
            docs = []
            for i, it in enumerate(items):
                d = dict(it)
                d["id"] = str(uuid.uuid4())
                d["order"] = i
                d["updatedAt"] = datetime.now(timezone.utc).isoformat()
                docs.append(d)
            if docs:
                await coll.insert_many(docs)
            logger.info(f"Seeded {len(docs)} default {kind}")

@api_router.get("/")
async def root():
    return {"message": "Los Santos Stadtführer API"}

# ======================================================================
#  Veröffentlichen: Inhalte via StateV Page Options pushen (gechunkt)
#  Schreiben benötigt API-Secret. Der Guide liest die Slots direkt (nur Bearer).
# ======================================================================
def _trim(items, keys):
    return [{k: it[k] for k in keys if k in it and it[k] != ""} for it in items]

async def _build_bundle():
    ev = _trim([_strip_id(d) for d in await db.content_events.find({}).sort("order", 1).to_list(500)], ("cat", "day", "mon", "title", "text", "time", "place", "bg"))
    nw = _trim([_strip_id(d) for d in await db.content_news.find({}).sort("order", 1).to_list(500)], ("tag", "tagLabel", "title", "text", "meta", "feature"))
    gl = _trim([_strip_id(d) for d in await db.content_gallery.find({}).sort("order", 1).to_list(500)], ("img", "grad", "cap", "ar"))
    si = _trim([_strip_id(d) for d in await db.content_sights.find({}).sort("order", 1).to_list(500)], ("img", "cat", "title", "desc"))
    pl = _trim([_strip_id(d) for d in await db.content_places.find({}).sort("order", 1).to_list(500)], ("cat", "icon", "title", "desc", "loc", "hours", "img"))
    jb = _trim([_strip_id(d) for d in await db.content_jobs.find({}).sort("order", 1).to_list(500)], ("icon", "title", "desc", "diff", "pay", "beginner", "img"))
    co = _trim([_strip_id(d) for d in await db.content_companies.find({}).sort("order", 1).to_list(500)], ("icon", "type", "title", "desc", "img"))
    fz = _trim([_strip_id(d) for d in await db.content_freizeit.find({}).sort("order", 1).to_list(500)], ("icon", "title", "desc", "long", "img"))
    firma = None
    try:
        lst = await sv_get("factory/list/")
        if isinstance(lst, list) and lst:
            firma = next((f for f in lst if f.get("id") == STATEV_FIRMA_ID), lst[0])
        if firma:
            firma = {k: firma.get(k) for k in ("id", "name", "isOpen", "address", "type") if k in firma}
    except Exception:
        firma = None
    bundle = {"events": ev, "news": nw, "gallery": gl, "sights": si, "places": pl,
              "jobs": jb, "companies": co, "freizeit": fz, "firma": firma}
    counts = {"events": len(ev), "news": len(nw), "gallery": len(gl), "sights": len(si),
              "places": len(pl), "jobs": len(jb), "companies": len(co), "freizeit": len(fz)}
    return bundle, counts, firma

@api_router.post("/publish")
async def publish(dry: bool = False, admin: dict = Depends(get_current_admin)):
    bundle, counts, firma = await _build_bundle()
    raw = json.dumps(bundle, ensure_ascii=False, separators=(",", ":"))
    CH = 2300
    chunks = [raw[i:i + CH] for i in range(0, len(raw), CH)]
    needed = len(chunks) + 1
    fits = needed <= 10
    if dry:
        return {"dry": True, "bytes": len(raw), "slots": needed, "fits": fits,
                "counts": counts, "firma": firma.get("name") if firma else None}
    if not STATEV_API_SECRET:
        raise HTTPException(status_code=503, detail="API-Secret fehlt. Bitte STATEV_API_SECRET im Backend hinterlegen (API-Key-Übersicht).")
    if not fits:
        raise HTTPException(status_code=413, detail=f"Inhalt zu groß ({len(raw)} Zeichen, {needed} Slots benötigt, 10 verfügbar). Bitte Inhalte/Bilder kürzen oder VAPI Premium nutzen (20 Slots).")
    await sv_post("factory/options", {"apiSecret": STATEV_API_SECRET, "factoryId": STATEV_FIRMA_ID, "option": 1,
                                      "title": "site", "data": json.dumps({"c": len(chunks), "len": len(raw)})})
    for i, ch in enumerate(chunks):
        await sv_post("factory/options", {"apiSecret": STATEV_API_SECRET, "factoryId": STATEV_FIRMA_ID,
                                          "option": 2 + i, "title": f"site:{i}", "data": ch})
    # Verbleibende, zuvor genutzte Slots leeren (falls Inhalt geschrumpft ist)
    for n in range(needed + 1, 11):
        try:
            await sv_post("factory/options", {"apiSecret": STATEV_API_SECRET, "factoryId": STATEV_FIRMA_ID,
                                              "option": n, "title": "", "data": ""})
        except Exception as e:
            logger.warning(f"Konnte Slot {n} nicht leeren: {e}")
    return {"ok": True, "slots": needed, "bytes": len(raw),
            "counts": counts, "firma": firma.get("name") if firma else None}

@api_router.get("/publish/status")
async def publish_status(admin: dict = Depends(get_current_admin)):
    try:
        slot = await sv_get(f"factory/options/{STATEV_FIRMA_ID}/1")
    except Exception:
        return {"published": False}
    data = slot.get("data") if isinstance(slot, dict) else None
    if not data:
        return {"published": False}
    try:
        meta = json.loads(data)
    except Exception:
        meta = {}
    return {"published": True, "chunks": meta.get("c"), "len": meta.get("len"), "lastUpdated": slot.get("lastUpdated")}

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await seed_content()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
