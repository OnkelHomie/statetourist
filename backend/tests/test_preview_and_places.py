"""Tests for /api/preview/bundle (admin draft), /api/content/places x/y fields,
publish flow continuity (8 sections, slots ~5), and static deletion of faq.html / guide.html.
Iteration 3 (preview iframe + GTA atlas marker picker + FAQ/Anfänger-Guide removal).
"""
import os
import subprocess
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://los-santos-guide.preview.emergentagent.com",
).rstrip("/")

ALL_KINDS = ["events", "news", "gallery", "sights", "places", "jobs", "companies", "freizeit"]


def _generate_admin_jwt() -> str:
    out = subprocess.check_output(
        [
            "python3",
            "-c",
            (
                "import jwt,os,datetime;"
                "from dotenv import load_dotenv;"
                "load_dotenv('/app/backend/.env');"
                "print(jwt.encode({'sub':'194164265383493632','username':'owner',"
                "'exp':datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(hours=2)},"
                "os.environ['JWT_SECRET'],algorithm='HS256'))"
            ),
        ],
        text=True,
    ).strip()
    return out


@pytest.fixture(scope="session")
def admin_token() -> str:
    return _generate_admin_jwt()


@pytest.fixture(scope="session")
def client_admin(admin_token):
    s = requests.Session()
    s.cookies.set("sv_admin", admin_token)
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def client_anon():
    return requests.Session()


# --- /api/preview/bundle ---
class TestPreviewBundle:
    def test_preview_bundle_requires_auth(self, client_anon):
        r = client_anon.get(f"{BASE_URL}/api/preview/bundle", timeout=20)
        assert r.status_code == 401

    def test_preview_bundle_returns_all_keys(self, client_admin):
        r = client_admin.get(f"{BASE_URL}/api/preview/bundle", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        for k in ["events", "news", "gallery", "sights", "places", "jobs",
                  "companies", "freizeit", "firma"]:
            assert k in data, f"preview/bundle missing key {k}"
        # places should be a non-empty list, each with numeric x and y
        assert isinstance(data["places"], list)
        assert len(data["places"]) > 0
        for p in data["places"]:
            assert "x" in p and "y" in p, f"places entry missing x/y: {p}"
            assert isinstance(p["x"], (int, float)), f"x is not numeric: {p}"
            assert isinstance(p["y"], (int, float)), f"y is not numeric: {p}"


# --- /api/content/places x/y verification ---
class TestPlacesXY:
    def test_places_returns_nine_entries_with_xy(self, client_anon):
        r = client_anon.get(f"{BASE_URL}/api/content/places", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 9, f"Expected 9 places, got {len(data)}"
        for entry in data:
            assert "id" in entry
            assert "_id" not in entry
            assert "x" in entry and "y" in entry
            assert isinstance(entry["x"], (int, float))
            assert isinstance(entry["y"], (int, float))
            # Reasonable bounds 0-100 (percentage)
            assert 0 <= entry["x"] <= 100
            assert 0 <= entry["y"] <= 100

    def test_places_update_xy_persists(self, client_admin):
        # GET current entries
        r = client_admin.get(f"{BASE_URL}/api/content/places", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert items, "No places to test update with"
        target = items[0]
        original_x = target["x"]
        original_y = target["y"]
        new_x = 42.5
        new_y = 17.25
        payload = {
            "cat": target.get("cat", "polizei"),
            "icon": target.get("icon", "📍"),
            "title": target.get("title", "TEST"),
            "desc": target.get("desc", ""),
            "loc": target.get("loc", ""),
            "hours": target.get("hours", ""),
            "img": target.get("img", ""),
            "x": new_x,
            "y": new_y,
        }
        try:
            r2 = client_admin.put(
                f"{BASE_URL}/api/content/places/{target['id']}", json=payload, timeout=20
            )
            assert r2.status_code == 200, r2.text
            updated = r2.json()
            assert float(updated["x"]) == new_x
            assert float(updated["y"]) == new_y

            # Verify via public GET
            r3 = requests.get(f"{BASE_URL}/api/content/places", timeout=20)
            entry = next((x for x in r3.json() if x["id"] == target["id"]), None)
            assert entry is not None
            assert float(entry["x"]) == new_x
            assert float(entry["y"]) == new_y
        finally:
            # Restore original
            payload["x"] = original_x
            payload["y"] = original_y
            client_admin.put(
                f"{BASE_URL}/api/content/places/{target['id']}", json=payload, timeout=20
            )


# --- /api/publish flow continuity ---
class TestPublishFlowStillWorks:
    def test_publish_dry_with_all_8_sections(self, client_admin):
        r = client_admin.post(f"{BASE_URL}/api/publish?dry=true", timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("dry") is True
        assert data.get("fits") is True
        slots = data.get("slots")
        assert isinstance(slots, int) and 1 <= slots <= 10
        counts = data.get("counts", {})
        for k in ALL_KINDS:
            assert k in counts, f"counts missing {k}"

    def test_publish_real_returns_ok(self, client_admin):
        r = client_admin.post(f"{BASE_URL}/api/publish", timeout=120)
        if r.status_code in (502, 503, 504):
            pytest.skip(f"Upstream vAPI unreachable: {r.status_code}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert "places" in data.get("counts", {})


# --- Static file removal ---
class TestStaticFilesRemoved:
    def test_faq_html_deleted_serves_spa_fallback(self, client_anon):
        # CRA dev server serves SPA fallback (200 with index.html) for missing static files.
        # The actual file is gone from /app/frontend/public/faq.html, which is what matters.
        import os as _os
        assert not _os.path.exists("/app/frontend/public/faq.html"), "faq.html should be deleted from disk"
        r = client_anon.get(f"{BASE_URL}/faq.html", timeout=15, allow_redirects=False)
        # Either 404 or SPA fallback (200 with index page content)
        if r.status_code == 200:
            assert "FAQ" not in r.text or 'data-page="start"' in r.text, \
                "faq.html should not serve original FAQ content"

    def test_guide_html_deleted_serves_spa_fallback(self, client_anon):
        import os as _os
        assert not _os.path.exists("/app/frontend/public/guide.html"), "guide.html should be deleted from disk"
        r = client_anon.get(f"{BASE_URL}/guide.html", timeout=15, allow_redirects=False)
        if r.status_code == 200:
            assert 'data-page="start"' in r.text or "Anf" not in r.text, \
                "guide.html should not serve original Anfänger-Guide content"

    def test_citymap_png_exists(self, client_anon):
        r = client_anon.get(f"{BASE_URL}/images/citymap.png", timeout=20, allow_redirects=False)
        assert r.status_code == 200, f"citymap.png missing: {r.status_code}"
        assert r.headers.get("content-type", "").startswith("image/")
        assert int(r.headers.get("content-length", "0")) > 1000
