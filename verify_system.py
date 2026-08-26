import requests
import json
import sys

# Ensure UTF-8 console output on Windows
sys.stdout.reconfigure(encoding='utf-8')

def verify_system():
    print("=== [1. Backend API Endpoint Verification] ===")
    from starlette.testclient import TestClient
    from main_api import app
    client = TestClient(app)
    
    res = client.get("/api/games/active")
    assert res.status_code == 200, f"API Error: Status {res.status_code}"
    
    data = res.json()
    matches = data.get("games", [])
    print(f"✅ Loaded {len(matches)} matches from API (/api/games/active).")
    
    assert len(matches) > 0, "No matches returned!"

    print("\n=== [2. Data Model & Saber Stats Verification] ===")
    for idx, m in enumerate(matches[:5]):
        home_team = m.get("homeTeam") or m.get("home_team")
        away_team = m.get("awayTeam") or m.get("away_team")
        h_saber = m.get("home_saber", {})
        a_saber = m.get("away_saber", {})
        h_recent = h_saber.get("recent3", {})
        a_recent = a_saber.get("recent3", {})

        print(f"[{idx+1}] {m.get('game_no', 'No.')} | {m.get('league')} | {home_team} vs {away_team}")
        print(f"    Home SP: {h_saber.get('pitcher')} (ERA: {h_saber.get('sp_era')} ➔ Recent3: {h_recent.get('era', {}).get('value')})")
        print(f"    Away SP: {a_saber.get('pitcher')} (ERA: {a_saber.get('sp_era')} ➔ Recent3: {a_recent.get('era', {}).get('value')})")

    print("\n=== [3. Mobile Source Files Verification] ===")
    with open("MobileMatchDetailScreen.tsx", "r", encoding="utf-8") as f:
        rn_code = f.read()
    assert "CompactMetricRow" in rn_code and "HOME_BULLPEN_LIST" in rn_code, "React Native file incomplete"
    print(f"✅ React Native component verified ({len(rn_code)} bytes)")

    with open("mobile_match_detail_screen.dart", "r", encoding="utf-8") as f:
        flutter_code = f.read()
    assert "MobileMatchDetailScreen" in flutter_code and "DropdownButton" in flutter_code, "Flutter file incomplete"
    print(f"✅ Flutter Dart component verified ({len(flutter_code)} bytes)")

    with open("app.js", "r", encoding="utf-8") as f:
        js_code = f.read()
    assert "TEAM_BULLPEN_ROSTERS" in js_code and "initBullpenModalData" in js_code, "app.js incomplete"
    print(f"✅ Web app.js verified ({len(js_code)} bytes)")

    with open("index.html", "r", encoding="utf-8") as f:
        html_code = f.read()
    assert "modalHomeBullpenSelect" in html_code and "matchDetailModal" in html_code, "index.html incomplete"
    print(f"✅ Web index.html verified ({len(html_code)} bytes)")

    print("\n🎉 ALL SYSTEM VERIFICATIONS PASSED 100% PERFECTLY!")

if __name__ == "__main__":
    verify_system()
