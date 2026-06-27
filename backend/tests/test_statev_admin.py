"""Backend tests for StateV admin proxy + CMS endpoints."""
import os
import pytest
import requests

BASE_URL = "https://ce9c8e4c-9176-4169-a78d-2d45326dfc08.preview.emergentagent.com"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJRQV9BRE1JTiIsInVzZXJuYW1lIjoicWEiLCJnbG9iYWxfbmFtZSI6IlFBIFRlc3RlciIsImV4cCI6MTc4MzE2OTU1MH0.b3YsHYzeqtIXt-C2YkE2KtwR-SZJcUPhe-x603XBdj8"


@pytest.fixture(scope="session")
def client_admin():
    s = requests.Session()
    s.cookies.set("sv_admin", TOKEN)
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def client_anon():
    return requests.Session()


# --- Auth gating ---
class TestAuthGating:
    def test_overview_without_cookie_returns_401(self, client_anon):
        r = client_anon.get(f"{BASE_URL}/api/firma/overview")
        assert r.status_code == 401

    def test_overview_with_cookie_returns_200(self, client_admin):
        r = client_admin.get(f"{BASE_URL}/api/firma/overview", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "current" in data
        assert data.get("current", {}).get("name") == "TouristAbzocke"


# --- Firma endpoints ---
class TestFirmaEndpoints:
    @pytest.mark.parametrize("path", [
        "/api/firma/inventory",
        "/api/firma/machine",
        "/api/firma/counter",
        "/api/firma/productions",
        "/api/firma/vehicles",
        "/api/firma/marketoffers",
        "/api/firma/buylog",
    ])
    def test_firma_endpoints_status_200(self, client_admin, path):
        r = client_admin.get(f"{BASE_URL}{path}", timeout=30)
        assert r.status_code == 200, f"{path} -> {r.status_code}: {r.text[:200]}"

    def test_bankaccounts_premium_flag(self, client_admin):
        r = client_admin.get(f"{BASE_URL}/api/firma/bankaccounts", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, dict)
        assert data.get("_premium") is True


# --- Buildings ---
class TestBuildings:
    def test_buildings_list_200(self, client_admin):
        r = client_admin.get(f"{BASE_URL}/api/buildings", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)


# --- CMS public + protection ---
class TestCMSPublic:
    def test_events_public_returns_list_of_six(self, client_anon):
        r = client_anon.get(f"{BASE_URL}/api/content/events")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 6, f"Expected 6 events, got {len(data)}"

    def test_events_post_without_cookie_returns_401(self, client_anon):
        r = client_anon.post(
            f"{BASE_URL}/api/content/events",
            json={"title": "X", "cat": "Test", "day": "01", "mon": "Jan",
                  "time": "10:00", "place": "Nowhere", "text": "x"},
        )
        assert r.status_code == 401


# --- CMS CRUD (events) ---
class TestCMSCrud:
    def test_event_crud_lifecycle(self, client_admin):
        # CREATE
        payload = {
            "title": "TEST_CRUD_EVENT",
            "cat": "Test",
            "day": "01",
            "mon": "Jan",
            "time": "12:00",
            "place": "Test Place",
            "text": "automated test event",
        }
        r = client_admin.post(f"{BASE_URL}/api/content/events", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        created = r.json()
        assert "id" in created
        assert created["title"] == "TEST_CRUD_EVENT"
        event_id = created["id"]

        try:
            # UPDATE
            r2 = client_admin.put(
                f"{BASE_URL}/api/content/events/{event_id}",
                json={"title": "TEST_CRUD_EVENT_UPDATED", "cat": "Test",
                      "day": "01", "mon": "Jan", "time": "12:00",
                      "place": "Test Place", "text": "updated"},
                timeout=20,
            )
            assert r2.status_code == 200, r2.text
            updated = r2.json()
            assert updated["title"] == "TEST_CRUD_EVENT_UPDATED"
        finally:
            # DELETE (cleanup)
            r3 = client_admin.delete(f"{BASE_URL}/api/content/events/{event_id}", timeout=20)
            assert r3.status_code == 200, r3.text
            assert r3.json() == {"ok": True}

        # Verify list size restored to 6 after cleanup
        r4 = client_admin.get(f"{BASE_URL}/api/content/events")
        assert r4.status_code == 200
        assert len(r4.json()) == 6
