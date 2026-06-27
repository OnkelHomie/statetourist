"""Tests for the 8-section CMS (events, news, gallery, sights, places, jobs, companies, freizeit)
and the /api/publish flow (dry-run, real publish, status).
"""
import os
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://los-santos-guide.preview.emergentagent.com").rstrip("/")

ALL_KINDS = ["events", "news", "gallery", "sights", "places", "jobs", "companies", "freizeit"]


def _generate_admin_jwt() -> str:
    """Sign a fresh admin JWT using backend JWT_SECRET so tests don't depend on a hardcoded token."""
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


# --- Public GET /api/content/{kind} for all 8 kinds ---
class TestPublicContentAllKinds:
    @pytest.mark.parametrize("kind", ALL_KINDS)
    def test_get_kind_returns_seeded_list(self, client_anon, kind):
        r = client_anon.get(f"{BASE_URL}/api/content/{kind}", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list), f"{kind} should return a list"
        assert len(data) > 0, f"{kind} should have at least 1 seeded entry"
        # Every entry should have an id and not leak Mongo _id
        for entry in data:
            assert "id" in entry
            assert "_id" not in entry


# --- Auth gating for new CRUD kinds ---
class TestNewKindsAuthGating:
    @pytest.mark.parametrize("kind", ["sights", "places", "jobs", "companies", "freizeit"])
    def test_post_without_cookie_returns_401(self, client_anon, kind):
        r = client_anon.post(f"{BASE_URL}/api/content/{kind}", json={"title": "x"}, timeout=15)
        assert r.status_code == 401, f"{kind} POST anon -> {r.status_code}"

    @pytest.mark.parametrize("kind", ["sights", "places", "jobs", "companies", "freizeit"])
    def test_put_without_cookie_returns_401(self, client_anon, kind):
        r = client_anon.put(f"{BASE_URL}/api/content/{kind}/some-id", json={"title": "x"}, timeout=15)
        assert r.status_code == 401, f"{kind} PUT anon -> {r.status_code}"

    @pytest.mark.parametrize("kind", ["sights", "places", "jobs", "companies", "freizeit"])
    def test_delete_without_cookie_returns_401(self, client_anon, kind):
        r = client_anon.delete(f"{BASE_URL}/api/content/{kind}/some-id", timeout=15)
        assert r.status_code == 401, f"{kind} DELETE anon -> {r.status_code}"


# --- CRUD lifecycle for new kinds (use companies) ---
class TestCompaniesCrudWithImage:
    def test_company_create_update_image_get_delete(self, client_admin):
        # CREATE
        payload = {"icon": "store", "type": "Gewerbe", "title": "TEST_CRUD_COMPANY",
                   "desc": "automated test", "img": ""}
        r = client_admin.post(f"{BASE_URL}/api/content/companies", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["title"] == "TEST_CRUD_COMPANY"
        cid = created["id"]
        try:
            # UPDATE with img=casino
            upd = {"icon": "store", "type": "Gewerbe", "title": "TEST_CRUD_COMPANY",
                   "desc": "automated test", "img": "casino"}
            r2 = client_admin.put(f"{BASE_URL}/api/content/companies/{cid}", json=upd, timeout=20)
            assert r2.status_code == 200, r2.text
            assert r2.json().get("img") == "casino"

            # GET shows img persisted
            r3 = requests.get(f"{BASE_URL}/api/content/companies", timeout=20)
            assert r3.status_code == 200
            entry = next((x for x in r3.json() if x["id"] == cid), None)
            assert entry is not None, "Created company not in GET list"
            assert entry.get("img") == "casino"
        finally:
            r4 = client_admin.delete(f"{BASE_URL}/api/content/companies/{cid}", timeout=20)
            assert r4.status_code == 200, r4.text


# --- /api/publish dry-run + real + status ---
class TestPublishFlow:
    def test_publish_dry_requires_auth(self, client_anon):
        r = client_anon.post(f"{BASE_URL}/api/publish?dry=true", timeout=20)
        assert r.status_code == 401

    def test_publish_dry_returns_counts_for_all_8_sections(self, client_admin):
        r = client_admin.post(f"{BASE_URL}/api/publish?dry=true", timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("dry") is True
        assert isinstance(data.get("fits"), bool)
        assert isinstance(data.get("slots"), int)
        assert isinstance(data.get("bytes"), int)
        assert data["slots"] >= 1
        counts = data.get("counts", {})
        for k in ALL_KINDS:
            assert k in counts, f"Missing count for {k}"
            assert isinstance(counts[k], int)
            assert counts[k] >= 0

    def test_publish_real_then_status_published(self, client_admin):
        r = client_admin.post(f"{BASE_URL}/api/publish", timeout=120)
        # If upstream is unreachable in test sandbox, allow 503/502 with informative message instead of failing the whole suite
        if r.status_code in (502, 503, 504):
            pytest.skip(f"Upstream StateV vAPI unreachable: {r.status_code} {r.text[:200]}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert isinstance(data.get("slots"), int) and data["slots"] >= 1
        assert isinstance(data.get("bytes"), int) and data["bytes"] > 0
        counts = data.get("counts", {})
        for k in ALL_KINDS:
            assert k in counts

        # Status afterwards
        s = client_admin.get(f"{BASE_URL}/api/publish/status", timeout=30)
        assert s.status_code == 200, s.text
        sd = s.json()
        assert sd.get("published") is True
