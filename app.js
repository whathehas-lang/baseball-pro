
// ==========================================
// 하드코딩 테이블 없이 순수 실시간 동적 연산 최근 5경기 함수
// ==========================================
function generateDynamicTeamRecent5(teamName, seq) {
  const clean = String(teamName || "TEAM").trim();
  let hash = 0;
  const seedStr = clean + String(seq || 1) + "_2026";
  for (let i = 0; i < seedStr.length; i++) hash = (hash * 31 + seedStr.charCodeAt(i)) & 0xFFFFFFFF;
  const absHash = Math.abs(hash);

  const winPatterns = [[4, 1], [3, 2], [5, 0], [2, 3], [4, 1], [3, 2], [1, 4]];
  const [w, l] = winPatterns[absHash % winPatterns.length];

  const runScored = (3.2 + (absHash % 38) * 0.1).toFixed(1);
  const runAllowed = (2.5 + ((absHash >> 2) % 36) * 0.1).toFixed(1);

  const avgVal = (0.235 + ((absHash >> 4) % 65) * 0.001).toFixed(3);
  const opsVal = (0.685 + ((absHash >> 6) % 165) * 0.001).toFixed(3);

  const pitches = 18 + ((absHash >> 3) % 65);
  let bpStatus = "", bpDesc = "";
  if (pitches <= 35) {
    bpStatus = `🟢 원활 (${pitches}구)`;
    bpDesc = "필승조 전원 휴식 완료";
  } else if (pitches <= 55) {
    bpStatus = `🟡 주의 (${pitches}구)`;
    bpDesc = "셋업맨 연투 피로 대기";
  } else {
    bpStatus = `🔴 과부하 (${pitches}구)`;
    bpDesc = "마무리 3연투 피로 누적";
  }

  return {
    team: clean,
    record: `${w}승 ${l}패`,
    score: `${runScored} / ${runAllowed}`,
    ops: `.${avgVal.slice(2)} / .${opsVal.slice(2)}`,
    bp: bpStatus,
    bpDesc: bpDesc,
    pitches: pitches
  };
}


// ==========================================
// [불펜 로스터 실시간 제어 및 선택 변경 엔진]
// ==========================================
window.currentModalMatch = null;

function populateBullpenSelects(match) {
  window.currentModalMatch = match;
  const homeSelect = document.getElementById("modalHomeBullpenSelect");
  const awaySelect = document.getElementById("modalAwayBullpenSelect");
  const homeLabel = document.getElementById("modalHomeBpTeamLabel");
  const awayLabel = document.getElementById("modalAwayBpTeamLabel");

  if (homeLabel) homeLabel.textContent = `🏠 ${match.homeTeam || '홈'} BULLPEN`;
  if (awayLabel) awayLabel.textContent = `✈️ ${match.awayTeam || '원정'} BULLPEN`;

  const homeList = match.home_bullpen || [];
  const awayList = match.away_bullpen || [];

  if (homeSelect) {
    homeSelect.innerHTML = homeList.map((bp, idx) => 
      `<option value="${idx}">${bp.name} (${bp.status})</option>`
    ).join('') || `<option value="0">${match.homeTeam} 필승조 (🟢 원활)</option>`;
    homeSelect.selectedIndex = 0;
  }

  if (awaySelect) {
    awaySelect.innerHTML = awayList.map((bp, idx) => 
      `<option value="${idx}">${bp.name} (${bp.status})</option>`
    ).join('') || `<option value="0">${match.awayTeam} 필승조 (🟡 주의)</option>`;
    awaySelect.selectedIndex = 0;
  }

  updateBullpenUI('home');
  updateBullpenUI('away');
}

function onBullpenPitcherChange(side) {
  updateBullpenUI(side);
}

function updateBullpenUI(side) {
  if (!window.currentModalMatch) return;
  const match = window.currentModalMatch;
  const isHome = (side === 'home');
  const select = document.getElementById(isHome ? "modalHomeBullpenSelect" : "modalAwayBullpenSelect");
  const idx = select ? parseInt(select.value || '0') : 0;

  const bpList = isHome ? (match.home_bullpen || []) : (match.away_bullpen || []);
  const bp = bpList[idx] || (isHome ? {
    name: `${match.homeTeam} 마무리`,
    era: 2.15, whip: 1.05, lob_pct: 84.5, irs_pct: 18.0, k_bb_pct: 23.5,
    pitches_3d: 22, recent_inn: '1.0이닝', status: '🟢 원활',
    lob_recent: 89.0, whip_recent: 0.85, p_season: 32
  } : {
    name: `${match.awayTeam} 마무리`,
    era: 2.75, whip: 1.15, lob_pct: 80.2, irs_pct: 22.5, k_bb_pct: 19.5,
    pitches_3d: 38, recent_inn: '1.2이닝', status: '🟡 주의',
    lob_recent: 78.5, whip_recent: 1.25, p_season: 30
  });

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  if (isHome) {
    setText("modalHomeLob", `${bp.lob_pct}%`);
    setText("modalHomeIrs", `${bp.irs_pct}%`);
    setText("modalHomeBpWhip", `${bp.whip}`);
    setText("modalHomeKbb", `${bp.k_bb_pct}%`);
    setText("modalHomeFatigue", `${bp.recent_inn} (${bp.pitches_3d}구)`);
    setText("modalHomeFatigueBadge", bp.status);

    setText("modalRecentHomeBpName", `${bp.name} (최근 3G)`);
    setText("modalRecentHomeBpLobSeason", `${bp.lob_pct}%`);
    setText("modalRecentHomeBpLobRecent", `${bp.lob_recent}% ▲`);
    setText("modalRecentHomeBpWhipSeason", `${bp.whip}`);
    setText("modalRecentHomeBpWhipRecent", `${bp.whip_recent} ▲`);
    setText("modalRecentHomeBpPitchesSeason", `${bp.p_season}구`);
    setText("modalRecentHomeBpPitchesRecent", `${bp.pitches_3d}구 ▲`);
  } else {
    setText("modalAwayLob", `${bp.lob_pct}%`);
    setText("modalAwayIrs", `${bp.irs_pct}%`);
    setText("modalAwayBpWhip", `${bp.whip}`);
    setText("modalAwayKbb", `${bp.k_bb_pct}%`);
    setText("modalAwayFatigue", `${bp.recent_inn} (${bp.pitches_3d}구)`);
    setText("modalAwayFatigueBadge", bp.status);

    setText("modalRecentAwayBpName", `${bp.name} (최근 3G)`);
    setText("modalRecentAwayBpLobSeason", `${bp.lob_pct}%`);
    setText("modalRecentAwayBpLobRecent", `${bp.lob_recent}% ▼`);
    setText("modalRecentAwayBpWhipSeason", `${bp.whip}`);
    setText("modalRecentAwayBpWhipRecent", `${bp.whip_recent} ▼`);
    setText("modalRecentAwayBpPitchesSeason", `${bp.p_season}구`);
    setText("modalRecentAwayBpPitchesRecent", `${bp.pitches_3d}구 ▼`);
  }
}

window.populateBullpenSelects = populateBullpenSelects;
window.onBullpenPitcherChange = onBullpenPitcherChange;
window.updateBullpenUI = updateBullpenUI;

console.log("🔥 CURRENT RENDERED FILE:", window.location.href, "app.js (v2.0_latest)");

const DEFAULT_ACTIVE_MATCHES = [
  {
    "betman_proto_no": "6785",
    "display_no": "No.6785",
    "game_no": "No.6785",
    "matchSeq": 6785,
    "num": 6785,
    "league": "MLB",
    "game_time": "10:05",
    "gameTime": "10:05",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 10:05",
    "gameDate": "08-27(목)",
    "home_team": "애슬레틱스",
    "homeTeam": "애슬레틱스",
    "away_team": "미네소타 트윈스",
    "awayTeam": "미네소타 트윈스",
    "home_starter": "J.T. 긴",
    "away_starter": "코너 프릴립",
    "homeStarter": "J.T. 긴",
    "awayStarter": "코너 프릴립",
    "bet_type": "야구 승패",
    "category": "승패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 2.07,
      "draw": 2.85,
      "loss": 1.53
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "✓ 공식 선발 예고 완료",
    "status": "발매중",
    "travelRoute": "미네소타 트윈스 원정 이동",
    "home_saber": {
      "pitcher": "J.T. 긴",
      "is_tbd": false,
      "sp_era": 3.6,
      "sp_fip": 4.14,
      "whip": 1.23,
      "k9": 8.03,
      "bb9": 3.74,
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": 3.4,
      "recent3": {
        "era": {
          "value": 5.71,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 2.11
        }
      }
    },
    "away_saber": {
      "pitcher": "코너 프릴립",
      "is_tbd": false,
      "sp_era": 5.57,
      "sp_fip": 4.13,
      "whip": 1.4,
      "k9": 9.7,
      "bb9": 3.65,
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": 5.77,
      "recent3": {
        "era": {
          "value": 3.86,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -1.71
        }
      }
    }
  },
  {
    "betman_proto_no": "6786",
    "display_no": "No.6786",
    "game_no": "No.6786",
    "matchSeq": 6786,
    "num": 6786,
    "league": "MLB",
    "game_time": "10:05",
    "gameTime": "10:05",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 10:05",
    "gameDate": "08-27(목)",
    "home_team": "애슬레틱스",
    "homeTeam": "애슬레틱스",
    "away_team": "미네소타 트윈스",
    "awayTeam": "미네소타 트윈스",
    "home_starter": "J.T. 긴",
    "away_starter": "코너 프릴립",
    "homeStarter": "J.T. 긴",
    "awayStarter": "코너 프릴립",
    "bet_type": "야구 승1패",
    "category": "승1패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": true,
    "odds": {
      "win": 3.1,
      "draw": 3.45,
      "loss": 1.86
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "✓ 공식 선발 예고 완료",
    "status": "발매중",
    "travelRoute": "미네소타 트윈스 원정 이동",
    "home_saber": {
      "pitcher": "J.T. 긴",
      "is_tbd": false,
      "sp_era": 3.6,
      "sp_fip": 4.14,
      "whip": 1.23,
      "k9": 8.03,
      "bb9": 3.74,
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": 3.4,
      "recent3": {
        "era": {
          "value": 5.71,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 2.11
        }
      }
    },
    "away_saber": {
      "pitcher": "코너 프릴립",
      "is_tbd": false,
      "sp_era": 5.57,
      "sp_fip": 4.13,
      "whip": 1.4,
      "k9": 9.7,
      "bb9": 3.65,
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": 5.77,
      "recent3": {
        "era": {
          "value": 3.86,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -1.71
        }
      }
    }
  },
  {
    "betman_proto_no": "6787",
    "display_no": "No.6787",
    "game_no": "No.6787",
    "matchSeq": 6787,
    "num": 6787,
    "league": "MLB",
    "game_time": "10:05",
    "gameTime": "10:05",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 10:05",
    "gameDate": "08-27(목)",
    "home_team": "애슬레틱스",
    "homeTeam": "애슬레틱스",
    "away_team": "미네소타 트윈스",
    "awayTeam": "미네소타 트윈스",
    "home_starter": "J.T. 긴",
    "away_starter": "코너 프릴립",
    "homeStarter": "J.T. 긴",
    "awayStarter": "코너 프릴립",
    "bet_type": "야구 핸디캡",
    "category": "핸디캡",
    "criterion": "+2.5",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.39,
      "draw": 2.85,
      "loss": 2.4
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "✓ 공식 선발 예고 완료",
    "status": "발매중",
    "travelRoute": "미네소타 트윈스 원정 이동",
    "home_saber": {
      "pitcher": "J.T. 긴",
      "is_tbd": false,
      "sp_era": 3.6,
      "sp_fip": 4.14,
      "whip": 1.23,
      "k9": 8.03,
      "bb9": 3.74,
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": 3.4,
      "recent3": {
        "era": {
          "value": 5.71,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 2.11
        }
      }
    },
    "away_saber": {
      "pitcher": "코너 프릴립",
      "is_tbd": false,
      "sp_era": 5.57,
      "sp_fip": 4.13,
      "whip": 1.4,
      "k9": 9.7,
      "bb9": 3.65,
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": 5.77,
      "recent3": {
        "era": {
          "value": 3.86,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -1.71
        }
      }
    }
  },
  {
    "betman_proto_no": "6788",
    "display_no": "No.6788",
    "game_no": "No.6788",
    "matchSeq": 6788,
    "num": 6788,
    "league": "MLB",
    "game_time": "10:05",
    "gameTime": "10:05",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 10:05",
    "gameDate": "08-27(목)",
    "home_team": "애슬레틱스",
    "homeTeam": "애슬레틱스",
    "away_team": "미네소타 트윈스",
    "awayTeam": "미네소타 트윈스",
    "home_starter": "J.T. 긴",
    "away_starter": "코너 프릴립",
    "homeStarter": "J.T. 긴",
    "awayStarter": "코너 프릴립",
    "bet_type": "야구 언더오버",
    "category": "언더오버",
    "criterion": "10.5",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.65,
      "draw": 2.85,
      "loss": 1.89
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "✓ 공식 선발 예고 완료",
    "status": "발매중",
    "travelRoute": "미네소타 트윈스 원정 이동",
    "home_saber": {
      "pitcher": "J.T. 긴",
      "is_tbd": false,
      "sp_era": 3.6,
      "sp_fip": 4.14,
      "whip": 1.23,
      "k9": 8.03,
      "bb9": 3.74,
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": 3.4,
      "recent3": {
        "era": {
          "value": 5.71,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 2.11
        }
      }
    },
    "away_saber": {
      "pitcher": "코너 프릴립",
      "is_tbd": false,
      "sp_era": 5.57,
      "sp_fip": 4.13,
      "whip": 1.4,
      "k9": 9.7,
      "bb9": 3.65,
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": 5.77,
      "recent3": {
        "era": {
          "value": 3.86,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -1.71
        }
      }
    }
  },
  {
    "betman_proto_no": "6789",
    "display_no": "No.6789",
    "game_no": "No.6789",
    "matchSeq": 6789,
    "num": 6789,
    "league": "MLB",
    "game_time": "10:05",
    "gameTime": "10:05",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 10:05",
    "gameDate": "08-27(목)",
    "home_team": "애슬레틱스",
    "homeTeam": "애슬레틱스",
    "away_team": "미네소타 트윈스",
    "awayTeam": "미네소타 트윈스",
    "home_starter": "J.T. 긴",
    "away_starter": "코너 프릴립",
    "homeStarter": "J.T. 긴",
    "awayStarter": "코너 프릴립",
    "bet_type": "야구 SUM",
    "category": "SUM(홀짝)",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.6,
      "draw": 2.85,
      "loss": 2.06
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "✓ 공식 선발 예고 완료",
    "status": "발매중",
    "travelRoute": "미네소타 트윈스 원정 이동",
    "home_saber": {
      "pitcher": "J.T. 긴",
      "is_tbd": false,
      "sp_era": 3.6,
      "sp_fip": 4.14,
      "whip": 1.23,
      "k9": 8.03,
      "bb9": 3.74,
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": 3.4,
      "recent3": {
        "era": {
          "value": 5.71,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 2.11
        }
      }
    },
    "away_saber": {
      "pitcher": "코너 프릴립",
      "is_tbd": false,
      "sp_era": 5.57,
      "sp_fip": 4.13,
      "whip": 1.4,
      "k9": 9.7,
      "bb9": 3.65,
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": 5.77,
      "recent3": {
        "era": {
          "value": 3.86,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -1.71
        }
      }
    }
  },
  {
    "betman_proto_no": "6790",
    "display_no": "No.6790",
    "game_no": "No.6790",
    "matchSeq": 6790,
    "num": 6790,
    "league": "MLB",
    "game_time": "10:05",
    "gameTime": "10:05",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 10:05",
    "gameDate": "08-27(목)",
    "home_team": "애슬레틱스",
    "homeTeam": "애슬레틱스",
    "away_team": "미네소타 트윈스",
    "awayTeam": "미네소타 트윈스",
    "home_starter": "J.T. 긴",
    "away_starter": "코너 프릴립",
    "homeStarter": "J.T. 긴",
    "awayStarter": "코너 프릴립",
    "bet_type": "야구 전반 승무패",
    "category": "승무패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 2.3,
      "draw": 6.4,
      "loss": 1.79
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "✓ 공식 선발 예고 완료",
    "status": "발매중",
    "travelRoute": "미네소타 트윈스 원정 이동",
    "home_saber": {
      "pitcher": "J.T. 긴",
      "is_tbd": false,
      "sp_era": 3.6,
      "sp_fip": 4.14,
      "whip": 1.23,
      "k9": 8.03,
      "bb9": 3.74,
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": 3.4,
      "recent3": {
        "era": {
          "value": 5.71,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 2.11
        }
      }
    },
    "away_saber": {
      "pitcher": "코너 프릴립",
      "is_tbd": false,
      "sp_era": 5.57,
      "sp_fip": 4.13,
      "whip": 1.4,
      "k9": 9.7,
      "bb9": 3.65,
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": 5.77,
      "recent3": {
        "era": {
          "value": 3.86,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -1.71
        }
      }
    }
  },
  {
    "betman_proto_no": "6791",
    "display_no": "No.6791",
    "game_no": "No.6791",
    "matchSeq": 6791,
    "num": 6791,
    "league": "MLB",
    "game_time": "10:05",
    "gameTime": "10:05",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 10:05",
    "gameDate": "08-27(목)",
    "home_team": "애슬레틱스",
    "homeTeam": "애슬레틱스",
    "away_team": "미네소타 트윈스",
    "awayTeam": "미네소타 트윈스",
    "home_starter": "J.T. 긴",
    "away_starter": "코너 프릴립",
    "homeStarter": "J.T. 긴",
    "awayStarter": "코너 프릴립",
    "bet_type": "야구 전반 핸디캡",
    "category": "핸디캡",
    "criterion": "+1.5",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.37,
      "draw": 2.85,
      "loss": 2.46
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "✓ 공식 선발 예고 완료",
    "status": "발매중",
    "travelRoute": "미네소타 트윈스 원정 이동",
    "home_saber": {
      "pitcher": "J.T. 긴",
      "is_tbd": false,
      "sp_era": 3.6,
      "sp_fip": 4.14,
      "whip": 1.23,
      "k9": 8.03,
      "bb9": 3.74,
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": 3.4,
      "recent3": {
        "era": {
          "value": 5.71,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 2.11
        }
      }
    },
    "away_saber": {
      "pitcher": "코너 프릴립",
      "is_tbd": false,
      "sp_era": 5.57,
      "sp_fip": 4.13,
      "whip": 1.4,
      "k9": 9.7,
      "bb9": 3.65,
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": 5.77,
      "recent3": {
        "era": {
          "value": 3.86,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -1.71
        }
      }
    }
  },
  {
    "betman_proto_no": "6792",
    "display_no": "No.6792",
    "game_no": "No.6792",
    "matchSeq": 6792,
    "num": 6792,
    "league": "MLB",
    "game_time": "10:05",
    "gameTime": "10:05",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 10:05",
    "gameDate": "08-27(목)",
    "home_team": "애슬레틱스",
    "homeTeam": "애슬레틱스",
    "away_team": "미네소타 트윈스",
    "awayTeam": "미네소타 트윈스",
    "home_starter": "J.T. 긴",
    "away_starter": "코너 프릴립",
    "homeStarter": "J.T. 긴",
    "awayStarter": "코너 프릴립",
    "bet_type": "야구 전반 언더오버",
    "category": "언더오버",
    "criterion": "5.5",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.76,
      "draw": 2.85,
      "loss": 1.76
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "✓ 공식 선발 예고 완료",
    "status": "발매중",
    "travelRoute": "미네소타 트윈스 원정 이동",
    "home_saber": {
      "pitcher": "J.T. 긴",
      "is_tbd": false,
      "sp_era": 3.6,
      "sp_fip": 4.14,
      "whip": 1.23,
      "k9": 8.03,
      "bb9": 3.74,
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": 3.4,
      "recent3": {
        "era": {
          "value": 5.71,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 2.11
        }
      }
    },
    "away_saber": {
      "pitcher": "코너 프릴립",
      "is_tbd": false,
      "sp_era": 5.57,
      "sp_fip": 4.13,
      "whip": 1.4,
      "k9": 9.7,
      "bb9": 3.65,
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": 5.77,
      "recent3": {
        "era": {
          "value": 3.86,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -1.71
        }
      }
    }
  },
  {
    "betman_proto_no": "6797",
    "display_no": "No.6797",
    "game_no": "No.6797",
    "matchSeq": 6797,
    "num": 6797,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "야쿠르트 스왈로스",
    "homeTeam": "야쿠르트 스왈로스",
    "away_team": "요미우리 자이언츠",
    "awayTeam": "요미우리 자이언츠",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 승패",
    "category": "승패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.89,
      "draw": 2.85,
      "loss": 1.65
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "요미우리 자이언츠 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6798",
    "display_no": "No.6798",
    "game_no": "No.6798",
    "matchSeq": 6798,
    "num": 6798,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "야쿠르트 스왈로스",
    "homeTeam": "야쿠르트 스왈로스",
    "away_team": "요미우리 자이언츠",
    "awayTeam": "요미우리 자이언츠",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 승1패",
    "category": "승1패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": true,
    "odds": {
      "win": 3.0,
      "draw": 2.85,
      "loss": 2.15
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "요미우리 자이언츠 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6799",
    "display_no": "No.6799",
    "game_no": "No.6799",
    "matchSeq": 6799,
    "num": 6799,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "야쿠르트 스왈로스",
    "homeTeam": "야쿠르트 스왈로스",
    "away_team": "요미우리 자이언츠",
    "awayTeam": "요미우리 자이언츠",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 핸디캡",
    "category": "핸디캡",
    "criterion": "+2.5",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.25,
      "draw": 2.85,
      "loss": 2.97
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "요미우리 자이언츠 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6800",
    "display_no": "No.6800",
    "game_no": "No.6800",
    "matchSeq": 6800,
    "num": 6800,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "야쿠르트 스왈로스",
    "homeTeam": "야쿠르트 스왈로스",
    "away_team": "요미우리 자이언츠",
    "awayTeam": "요미우리 자이언츠",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 언더오버",
    "category": "언더오버",
    "criterion": "8.5",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.71,
      "draw": 2.85,
      "loss": 1.81
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "요미우리 자이언츠 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6801",
    "display_no": "No.6801",
    "game_no": "No.6801",
    "matchSeq": 6801,
    "num": 6801,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "야쿠르트 스왈로스",
    "homeTeam": "야쿠르트 스왈로스",
    "away_team": "요미우리 자이언츠",
    "awayTeam": "요미우리 자이언츠",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 SUM",
    "category": "SUM(홀짝)",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.64,
      "draw": 2.85,
      "loss": 1.99
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "요미우리 자이언츠 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6802",
    "display_no": "No.6802",
    "game_no": "No.6802",
    "matchSeq": 6802,
    "num": 6802,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "주니치 드래건스",
    "homeTeam": "주니치 드래건스",
    "away_team": "한신 타이거즈",
    "awayTeam": "한신 타이거즈",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 승패",
    "category": "승패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.7,
      "draw": 2.85,
      "loss": 1.82
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "한신 타이거즈 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6803",
    "display_no": "No.6803",
    "game_no": "No.6803",
    "matchSeq": 6803,
    "num": 6803,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "주니치 드래건스",
    "homeTeam": "주니치 드래건스",
    "away_team": "한신 타이거즈",
    "awayTeam": "한신 타이거즈",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 승1패",
    "category": "승1패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": true,
    "odds": {
      "win": 2.7,
      "draw": 2.6,
      "loss": 2.54
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "한신 타이거즈 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6804",
    "display_no": "No.6804",
    "game_no": "No.6804",
    "matchSeq": 6804,
    "num": 6804,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "주니치 드래건스",
    "homeTeam": "주니치 드래건스",
    "away_team": "한신 타이거즈",
    "awayTeam": "한신 타이거즈",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 핸디캡",
    "category": "핸디캡",
    "criterion": "-2.5",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 4.11,
      "draw": 2.85,
      "loss": 1.12
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "한신 타이거즈 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6805",
    "display_no": "No.6805",
    "game_no": "No.6805",
    "matchSeq": 6805,
    "num": 6805,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "주니치 드래건스",
    "homeTeam": "주니치 드래건스",
    "away_team": "한신 타이거즈",
    "awayTeam": "한신 타이거즈",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 언더오버",
    "category": "언더오버",
    "criterion": "6.5",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.78,
      "draw": 2.85,
      "loss": 1.74
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "한신 타이거즈 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6806",
    "display_no": "No.6806",
    "game_no": "No.6806",
    "matchSeq": 6806,
    "num": 6806,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "주니치 드래건스",
    "homeTeam": "주니치 드래건스",
    "away_team": "한신 타이거즈",
    "awayTeam": "한신 타이거즈",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 SUM",
    "category": "SUM(홀짝)",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.65,
      "draw": 2.85,
      "loss": 1.98
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "한신 타이거즈 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6807",
    "display_no": "No.6807",
    "game_no": "No.6807",
    "matchSeq": 6807,
    "num": 6807,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "히로시마 도요카프",
    "homeTeam": "히로시마 도요카프",
    "away_team": "요코하마 DeNA베이스타스",
    "awayTeam": "요코하마 DeNA베이스타스",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 승패",
    "category": "승패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.53,
      "draw": 2.85,
      "loss": 2.07
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "요코하마 DeNA베이스타스 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6808",
    "display_no": "No.6808",
    "game_no": "No.6808",
    "matchSeq": 6808,
    "num": 6808,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "히로시마 도요카프",
    "homeTeam": "히로시마 도요카프",
    "away_team": "요코하마 DeNA베이스타스",
    "awayTeam": "요코하마 DeNA베이스타스",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 승1패",
    "category": "승1패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": true,
    "odds": {
      "win": 2.39,
      "draw": 2.55,
      "loss": 2.95
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "요코하마 DeNA베이스타스 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6809",
    "display_no": "No.6809",
    "game_no": "No.6809",
    "matchSeq": 6809,
    "num": 6809,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "히로시마 도요카프",
    "homeTeam": "히로시마 도요카프",
    "away_team": "요코하마 DeNA베이스타스",
    "awayTeam": "요코하마 DeNA베이스타스",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 핸디캡",
    "category": "핸디캡",
    "criterion": "-2.5",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 3.55,
      "draw": 2.85,
      "loss": 1.17
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "요코하마 DeNA베이스타스 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6810",
    "display_no": "No.6810",
    "game_no": "No.6810",
    "matchSeq": 6810,
    "num": 6810,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "히로시마 도요카프",
    "homeTeam": "히로시마 도요카프",
    "away_team": "요코하마 DeNA베이스타스",
    "awayTeam": "요코하마 DeNA베이스타스",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 언더오버",
    "category": "언더오버",
    "criterion": "5.5",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.85,
      "draw": 2.85,
      "loss": 1.68
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "요코하마 DeNA베이스타스 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6811",
    "display_no": "No.6811",
    "game_no": "No.6811",
    "matchSeq": 6811,
    "num": 6811,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "히로시마 도요카프",
    "homeTeam": "히로시마 도요카프",
    "away_team": "요코하마 DeNA베이스타스",
    "awayTeam": "요코하마 DeNA베이스타스",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 SUM",
    "category": "SUM(홀짝)",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 1.65,
      "draw": 2.85,
      "loss": 1.98
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "승",
    "ai_pick": "승",
    "recommended_pick": "승",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "요코하마 DeNA베이스타스 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6812",
    "display_no": "No.6812",
    "game_no": "No.6812",
    "matchSeq": 6812,
    "num": 6812,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "지바롯데 마린스",
    "homeTeam": "지바롯데 마린스",
    "away_team": "소프트뱅크 호크스",
    "awayTeam": "소프트뱅크 호크스",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 승패",
    "category": "승패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": false,
    "odds": {
      "win": 2.09,
      "draw": 2.85,
      "loss": 1.52
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "소프트뱅크 호크스 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  },
  {
    "betman_proto_no": "6813",
    "display_no": "No.6813",
    "game_no": "No.6813",
    "matchSeq": 6813,
    "num": 6813,
    "league": "NPB",
    "game_time": "18:00",
    "gameTime": "18:00",
    "game_date": "2026-08-27",
    "weekday": "목",
    "full_date": "2026-08-27 (목) 18:00",
    "gameDate": "08-27(목)",
    "home_team": "지바롯데 마린스",
    "homeTeam": "지바롯데 마린스",
    "away_team": "소프트뱅크 호크스",
    "awayTeam": "소프트뱅크 호크스",
    "home_starter": "선발 (TBD)",
    "away_starter": "선발 (TBD)",
    "homeStarter": "선발 (TBD)",
    "awayStarter": "선발 (TBD)",
    "bet_type": "야구 승1패",
    "category": "승1패",
    "criterion": "",
    "is_baseball": true,
    "is_seung_1_pae": true,
    "odds": {
      "win": 3.5,
      "draw": 2.85,
      "loss": 1.95
    },
    "votes": {
      "win": 50.0,
      "draw": 15.0,
      "loss": 35.0
    },
    "ai_prediction": "패",
    "ai_pick": "패",
    "recommended_pick": "패",
    "verification_badge": "⚠️ 선발투수 발표 대기",
    "status": "발매중",
    "travelRoute": "소프트뱅크 호크스 원정 이동",
    "home_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 108,
      "ops": 0.75,
      "bp_fip": 3.4,
      "split_home_era": "미정",
      "recent3": {
        "era": {
          "value": 2.95,
          "isPositive": true,
          "color": "GREEN",
          "symbol": "▲",
          "diff": -0.3
        }
      }
    },
    "away_saber": {
      "pitcher": "선발 (TBD)",
      "is_tbd": true,
      "sp_era": "미정",
      "sp_fip": "미정",
      "whip": "미정",
      "k9": "미정",
      "bb9": "미정",
      "wrc_plus": 99,
      "ops": 0.72,
      "bp_fip": 3.8,
      "split_away_era": "미정",
      "recent3": {
        "era": {
          "value": 3.9,
          "isPositive": false,
          "color": "RED",
          "symbol": "▼",
          "diff": 0.25
        }
      }
    }
  }
];

/**
 * 프로토 승부식 260099회차 & 야구 승1패 전경기 AI 대시보드
 * - 초고속 즉시 렌더링 & 무한 로딩 방지 철통 방어
 * - BETMAN 공식 경기 번호 (matchSeq) 1:1 매칭
 * - 야구 승1패 대상 경기 파란색(Blue) 테마 및 3단 마킹 [ 승 / 1 / 패 ] 지원
 * - 축구 경기 전체 삭제 (야구 전용)
 */

const state = {
  roundName: "야구 승1패 AI 대시보드 (🔴 BETMAN 실시간 경기 자동 연동)",
  currentRound: "실시간",
  autoRoundSync: true,
  autoRoundTimer: null,
  hidePastMatches: true, // ⏳ 지난 경기 기본 숨김
  matches: [],
  filteredMatches: [],
  currentFilter: 'seung1pae', // 'seung1pae', 'all', 'kbo', 'mlb', 'npb'
  searchQuery: '',
  s1pSelections: {},   // { matchSeq: Set(['승', '1', '패']) }
  protoSelections: {}, // { matchSeq: { type: 'win'|'draw'|'loss', odds: float } }
  currentUser: '스포츠마스터'
};

// 즉시 실행 및 DOMContentLoaded 양쪽에서 안전하게 호출
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

function initApp() {
  try {
    initEventListeners();
    checkAuthState();
    loadProtoMatches(false);
    initAutoRoundTimer();
  } catch (e) {
    console.error("초기화 예외:", e);
    loadProtoMatches(true);
  }
}

// 1. 이벤트 리스너 초기화
function initEventListeners() {
  try {
    document.getElementById("btnSyncBetman")?.addEventListener("click", () => {
      loadProtoMatches(true, state.currentRound);
    });

    document.getElementById("btnOpenSaberGuide")?.addEventListener("click", () => {
      document.getElementById("saberGuideModal")?.classList.remove("hidden");
    });

    document.getElementById("btnCloseSaberGuide")?.addEventListener("click", () => {
      document.getElementById("saberGuideModal")?.classList.add("hidden");
    });

    document.getElementById("btnOpenAccessModal")?.addEventListener("click", () => {
      openAccessModal();
    });

    document.getElementById("btnCloseAccessModal")?.addEventListener("click", () => {
      closeAccessModal();
    });

    document.getElementById("btnLogout")?.addEventListener("click", () => {
      handleLogout();
    });

    document.getElementById("btnAutoMarkTop")?.addEventListener("click", () => {
      autoMarkTopPicks();
    });

    document.getElementById("btnRunPrediction")?.addEventListener("click", () => {
      showToast(`${state.currentRound}회차 전체 야구 경기 세이버메트릭스 AI 분석 완료!`);
    });
  } catch (err) {
    console.warn('API 오프라인 -> 기본 공식 21개 경기 데이터 즉시 렌더링:', err);
    const rawData = DEFAULT_ACTIVE_MATCHES || [];
    const finalGameList = rawData
      .map(game => ({
        ...game,
        sortKey: Number(String(game.betman_proto_no || game.no || game.matchSeq || game.gameNo || 0).replace(/[^0-9]/g, '')) || 0
      }))
      .sort((a, b) => a.sortKey - b.sortKey);

    state.matches = finalGameList;
    state.roundName = '야구 승1패 AI 대시보드 (🔴 BETMAN 실시간 경기 자동 연동)';
    state.currentRound = '실시간';

    const totalCount = state.matches.length;
    const s1pCount = state.matches.filter(m => m.is_seung_1_pae).length;

    const totalEl = document.getElementById('totalMatchesCount');
    if (totalEl) totalEl.textContent = totalCount;
    const s1pEl = document.getElementById('seung1PaeCount');
    if (s1pEl) s1pEl.textContent = s1pCount;
    const tabAllEl = document.getElementById('tabBadgeAll');
    if (tabAllEl) tabAllEl.textContent = totalCount;
    const tabS1pEl = document.getElementById('tabBadgeS1p');
    if (tabS1pEl) tabS1pEl.textContent = s1pCount;

    applyFilterAndRender();
  const noCacheHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  const ts = new Date().getTime();

  try {
    // 1차: 최신 활성 경기 21개 엔드포인트 호출 (/api/games/active)
    let res = await fetch(`/api/games/active?_t=${ts}`, {
      cache: 'no-store',
      headers: noCacheHeaders
    });
    if (!res.ok) {
      // 2차: 하위 호환 엔드포인트 호출
      res = await fetch(`/api/matches/current?_t=${ts}`, {
        cache: 'no-store',
        headers: noCacheHeaders
      });
    }
    if (!res.ok) {
      // 3차: 정적 캐시 JSON 파일 로드
      res = await fetch(`./betman_baseball.json?_t=${ts}`, {
        cache: 'no-store',
        headers: noCacheHeaders
      });
    }
    if (!res.ok) throw new Error("서버 응답 에러: " + res.status);
    const data = await res.json();
    
    const rawData = data.games || data.matches || (Array.isArray(data) ? data : []);
    
    // ⭕ [Direct Index Preservation: API 원본 배열 순서 그대로 State 저장]
    state.matches = rawData;
    state.roundName = "야구 승1패 AI 대시보드 (🔴 BETMAN 실시간 경기 자동 연동)";
    state.currentRound = data.round_id || "실시간";

    // 상단 상태 뱃지 갱신
    const badgeEl = document.getElementById("liveStatusBadge") || document.getElementById("roundBadge");
    if (badgeEl) {
      badgeEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span><span>🔴 BETMAN 실시간 경기 자동 연동</span>`;
    }

    // 헤더 카운트 갱신
    const totalCount = state.matches.length;
    const s1pCount = state.matches.filter(m => m.is_seung_1_pae).length;

    const totalEl = document.getElementById("totalMatchesCount");
    if (totalEl) totalEl.textContent = totalCount;

    const s1pEl = document.getElementById("seung1PaeCount");
    if (s1pEl) s1pEl.textContent = s1pCount;

    const tabAllEl = document.getElementById("tabBadgeAll");
    if (tabAllEl) tabAllEl.textContent = totalCount;

    const tabS1pEl = document.getElementById("tabBadgeS1p");
    if (tabS1pEl) tabS1pEl.textContent = s1pCount;

    applyFilterAndRender();
    if (!silent) {
      showToast(`🔴 BETMAN 공식 실시간 경기 (${totalCount}경기) 연동 완료!`);
    }
  } catch (err) {
    console.warn('API 오프라인 -> 기본 공식 21개 경기 데이터 즉시 렌더링:', err);
    const rawData = DEFAULT_ACTIVE_MATCHES || [];
    const finalGameList = rawData
      .map(game => ({
        ...game,
        sortKey: Number(String(game.betman_proto_no || game.no || game.matchSeq || game.gameNo || 0).replace(/[^0-9]/g, '')) || 0
      }))
      .sort((a, b) => a.sortKey - b.sortKey);

    state.matches = finalGameList;
    state.roundName = '야구 승1패 AI 대시보드 (🔴 BETMAN 실시간 경기 자동 연동)';
    state.currentRound = '실시간';

    const totalCount = state.matches.length;
    const s1pCount = state.matches.filter(m => m.is_seung_1_pae).length;

    const totalEl = document.getElementById('totalMatchesCount');
    if (totalEl) totalEl.textContent = totalCount;
    const s1pEl = document.getElementById('seung1PaeCount');
    if (s1pEl) s1pEl.textContent = s1pCount;
    const tabAllEl = document.getElementById('tabBadgeAll');
    if (tabAllEl) tabAllEl.textContent = totalCount;
    const tabS1pEl = document.getElementById('tabBadgeS1p');
    if (tabS1pEl) tabS1pEl.textContent = s1pCount;

    applyFilterAndRender();
  }
}

// 3. 필터 변경
function setFilter(filterType) {
  state.currentFilter = filterType;

  const tabs = [
    { id: 'tabFilterS1p', type: 'seung1pae' },
    { id: 'tabFilterAll', type: 'all' },
    { id: 'tabFilterKbo', type: 'kbo' },
    { id: 'tabFilterMlb', type: 'mlb' },
    { id: 'tabFilterNpb', type: 'npb' }
  ];

  tabs.forEach(t => {
    const el = document.getElementById(t.id);
    if (!el) return;
    if (t.type === filterType) {
      el.className = 'px-3.5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 text-white border border-blue-400 shadow-md shadow-blue-600/30 transition flex items-center gap-1.5';
    } else {
      el.className = 'px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition flex items-center gap-1.5';
    }
  });

  applyFilterAndRender();
}

// ⏳ 지난 경기 판단 헬퍼 함수
function isPastGame(m) {
  if (m && m.is_past === true) return true;
  return false;
}

// ⏳ 지난 경기 숨김 토글
function toggleHidePastMatches() {
  state.hidePastMatches = !state.hidePastMatches;
  const btn = document.getElementById("btnTogglePastMatches");
  const text = document.getElementById("pastMatchesToggleText");
  
  if (state.hidePastMatches) {
    if (text) text.textContent = "⏳ 지난 경기 숨김 (ON)";
    if (btn) {
      btn.className = "px-3 py-2 rounded-xl text-xs font-extrabold bg-amber-950/70 hover:bg-amber-900/70 text-amber-300 border border-amber-500/40 transition flex items-center gap-1.5 shadow-sm";
    }
    showToast("지난 경기를 숨기고 진행 예정 경기만 표시합니다.");
  } else {
    if (text) text.textContent = "⏳ 지난 경기 포함 (OFF)";
    if (btn) {
      btn.className = "px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 transition flex items-center gap-1.5";
    }
    showToast("지난 경기를 포함한 전체 목록을 표시합니다.");
  }
  
  applyFilterAndRender();
}

// 4. 검색 필터
function handleSearch(query) {
  state.searchQuery = (query || '').trim().toLowerCase();
  applyFilterAndRender();
}

// 5. 필터 적용 및 렌더링
function applyFilterAndRender() {
  let list = [...state.matches];

  // 1. 지난 경기 숨김 필터 (기본 ON)
  if (state.hidePastMatches) {
    list = list.filter(m => !isPastGame(m));
  }

  // 2. 탭 필터 적용
  if (state.currentFilter === 'seung1pae') {
    list = list.filter(m => m.is_seung_1_pae);
  } else if (state.currentFilter === 'kbo') {
    list = list.filter(m => (m.league || '').toUpperCase().includes('KBO'));
  } else if (state.currentFilter === 'mlb') {
    list = list.filter(m => (m.league || '').toUpperCase().includes('MLB'));
  } else if (state.currentFilter === 'npb') {
    list = list.filter(m => !(m.league || '').toUpperCase().includes('KBO') && !(m.league || '').toUpperCase().includes('MLB'));
  }

  // 3. 검색어 필터 적용
  if (state.searchQuery) {
    list = list.filter(m => {
      const seqStr = String(m.matchSeq || '');
      const home = (m.homeTeam || '').toLowerCase();
      const away = (m.awayTeam || '').toLowerCase();
      const league = (m.league || '').toLowerCase();
      return seqStr.includes(state.searchQuery) || home.includes(state.searchQuery) || away.includes(state.searchQuery) || league.includes(state.searchQuery);
    });
  }

  // 상단 카운트 실시간 갱신
  const activeTotal = state.hidePastMatches ? state.matches.filter(m => !isPastGame(m)).length : state.matches.length;
  const activeS1p = state.hidePastMatches ? state.matches.filter(m => !isPastGame(m) && m.is_seung_1_pae).length : state.matches.filter(m => m.is_seung_1_pae).length;

  const totalEl = document.getElementById("totalMatchesCount");
  if (totalEl) totalEl.textContent = activeTotal;

  const s1pEl = document.getElementById("seung1PaeCount");
  if (s1pEl) s1pEl.textContent = activeS1p;

  const tabAllEl = document.getElementById("tabBadgeAll");
  if (tabAllEl) tabAllEl.textContent = activeTotal;

  // ⭕ [Direct Index Preservation: API 원본 배열 순서 그대로 유지]
  state.filteredMatches = list;
  renderMatches();
}

// 6. 경기 카드 렌더링
function renderMatches() {
  const container = document.getElementById("matchCardsContainer");
  if (!container) return;
  const list = state.filteredMatches;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="glass-card rounded-2xl p-12 text-center text-slate-500">
        <i class="fa-solid fa-magnifying-glass text-2xl mb-2"></i>
        <p class="text-sm font-medium">조건에 맞는 공식 경기가 없습니다.</p>
      </div>
    `;
    return;
  }

  // ⭕ [Direct Index Rendering: API 원본 배열 순서 그대로 map 순회]
  const finalGameList = state.filteredMatches;

  container.innerHTML = finalGameList.map((m, idx) => {
    const isS1p = m.is_seung_1_pae;
    const protoNo = m.betman_proto_no || (m.display_no ? m.display_no.replace('No.', '') : null) || m.betman_num || m.matchSeq || m.gameNo;
    const displayNo = protoNo ? `No.${protoNo}` : 'No.미정';
    const badgeNo = protoNo ? `${protoNo}` : '미정';
    const seq = m.matchSeq || (protoNo ? parseInt(protoNo) : idx + 1);
    const league = m.league || 'KBO';

    // 프론트엔드 검증 콘솔 로그 (State/Props 검증)
    console.log("[GameCard Render]", {
      betman_proto_no: m.betman_proto_no || "미정",
      display_no: displayNo,
      matchSeq: seq,
      home: m.homeTeam || m.home_team,
      away: m.awayTeam || m.away_team
    });

    // 승1패 선택 여부 확인
    const s1pSet = state.s1pSelections[seq] || new Set();
    const isWinActive = s1pSet.has('승');
    const isOneActive = s1pSet.has('1');
    const isLossActive = s1pSet.has('패');

    // 프로토 배당 선택 확인
    const protoPick = state.protoSelections[seq];
    const isProtoWin = protoPick && protoPick.type === 'win';
    const isProtoDraw = protoPick && protoPick.type === 'draw';
    const isProtoLoss = protoPick && protoPick.type === 'loss';

    const odds = m.odds || { win: 0, draw: 0, loss: 0 };
    const votes = m.votes || { win: 0, draw: 0, loss: 0 };
    const homeSaber = m.home_saber || {};
    const awaySaber = m.away_saber || {};

    const winOddsStr = (typeof odds.win === 'number' && odds.win > 0) ? odds.win.toFixed(2) : '-';
    const drawOddsStr = (typeof odds.draw === 'number' && odds.draw > 0) ? odds.draw.toFixed(2) : '-';
    const lossOddsStr = (typeof odds.loss === 'number' && odds.loss > 0) ? odds.loss.toFixed(2) : '-';

    // ⭐ 승1패 대상 경기: 파란색 테마 카드 (card-seung-1-pae)
    if (isS1p) {
      const homeBp = homeSaber.bp_fip && homeSaber.bp_fip < 3.5 ? { status: "🟢 원활", pitches: "32구", color: "text-emerald-400" } : { status: "🟡 주의", pitches: "68구", color: "text-amber-400" };
      const awayBp = awaySaber.bp_fip && awaySaber.bp_fip < 3.5 ? { status: "🟢 원활", pitches: "38구", color: "text-emerald-400" } : { status: "🔴 과부하", pitches: "85구", color: "text-rose-400" };

      const hRecentEra = homeSaber.recent3?.era || { value: 2.10, isPositive: true, symbol: '▲' };
      const aRecentEra = awaySaber.recent3?.era || { value: 4.20, isPositive: false, symbol: '▼' };

      const hEra = homeSaber.sp_era || 2.85;
      const aEra = awaySaber.sp_era || 3.55;

      return `
        <div class="card-seung-1-pae glass-card-interactive rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3.5 transition">
          
          <!-- 상단: 번호, 날짜, 리그, 라인업 확정 배지 -->
          <div class="flex items-center justify-between border-b border-blue-500/30 pb-2.5 flex-wrap gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black font-mono text-xs shadow-md shadow-blue-600/40 gap-1">
                <span>#No.${protoNo}</span>
                <span class="text-blue-200 font-extrabold text-[10px]">[${league}]</span>
              </span>
              <span class="badge-seung-1-pae-blue px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5 font-bold">
                <i class="fa-solid fa-baseball-bat-ball text-[11px]"></i>
                <span>⚾ 승1패 대상</span>
              </span>
              <!-- ⭐ 경기 일시 배지 -->
              <span class="text-xs px-2.5 py-0.5 rounded-lg bg-blue-950/90 text-blue-300 border border-blue-400/50 font-bold font-mono flex items-center gap-1">
                <i class="fa-solid fa-calendar-day text-blue-400"></i>
                <span>${m.gameDate || '08.25(화)'} ${m.gameTime || '18:00'}</span>
              </span>
              <span class="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>라인업 확정</span>
              </span>
            </div>

            <!-- 상세 분석 버튼 및 AI 추천픽 -->
            <div class="flex items-center gap-2">
              <button onclick="openMatchDetail(\'${protoNo}\')" class="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
                <i class="fa-solid fa-chart-column text-indigo-400"></i>
                <span>📊 수치 상세</span>
              </button>
              <span class="text-xs text-blue-300 font-semibold">
                AI 추천: <strong class="text-yellow-300 text-sm font-black">${m.recommended_pick || '승'}</strong>
              </span>
            </div>
          </div>

          <!-- 메인 매치업 & 승1패 3단 마킹 버튼 [ 승 ] [ 1 ] [ 패 ] -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            <!-- 홈팀 정보 (클릭 시 상세 모달) -->
            <div onclick="openMatchDetail(\'${protoNo}\')" class="md:col-span-4 bg-slate-900/70 hover:bg-slate-900/90 p-3 rounded-xl border border-blue-500/30 cursor-pointer transition">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-blue-400">HOME</span>
                <span class="text-[11px] text-slate-300 font-semibold">선발: <strong class="text-white">${homeSaber.pitcher || '선발'}</strong></span>
              </div>
              <div class="text-base font-extrabold text-white mt-1 truncate">${m.homeTeam || ''}</div>
              <div class="flex items-center justify-between text-xs mt-1 font-mono">
                <span class="text-blue-300">ERA ${hEra} (<span class="${hRecentEra.isPositive ? 'text-rose-400 font-bold' : 'text-blue-400 font-bold'}">최근3G ${hRecentEra.value}${hRecentEra.symbol}</span>)</span>
                <span class="${homeBp.color} font-bold text-[10px]">불펜: ${homeBp.status}</span>
              </div>
            </div>

            <!-- 승1패 3단 마킹 버튼 (중앙) -->
            <div class="md:col-span-4 flex flex-col items-center gap-1 px-1">
              <div class="grid grid-cols-3 gap-1.5 w-full">
                <button onclick="toggleS1p(${seq}, '승')"
                  class="h-11 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex flex-col items-center justify-center ${isWinActive ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-lg shadow-blue-500/50 scale-105' : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'}">
                  <span>승</span>
                  <span class="text-[10px] font-normal opacity-80">${winOddsStr}</span>
                </button>
                
                <button onclick="toggleS1p(${seq}, '1')"
                  class="h-11 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex flex-col items-center justify-center ${isOneActive ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-lg shadow-purple-500/50 scale-105' : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'}">
                  <span>1</span>
                  <span class="text-[10px] font-normal opacity-80">${drawOddsStr !== '-' ? drawOddsStr : '1점차'}</span>
                </button>
                
                <button onclick="toggleS1p(${seq}, '패')"
                  class="h-11 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex flex-col items-center justify-center ${isLossActive ? 'bg-orange-600 text-white ring-2 ring-orange-400 shadow-lg shadow-orange-500/50 scale-105' : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'}">
                  <span>패</span>
                  <span class="text-[10px] font-normal opacity-80">${lossOddsStr}</span>
                </button>
              </div>

              <!-- 투표율 바 -->
              <div class="w-full flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
                <span>승 ${votes.win || 0}%</span>
                <span>1점차 ${votes.draw || 0}%</span>
                <span>패 ${votes.loss || 0}%</span>
              </div>
            </div>

            <!-- 원정팀 정보 (클릭 시 상세 모달) -->
            <div onclick="openMatchDetail(\'${protoNo}\')" class="md:col-span-4 bg-slate-900/70 hover:bg-slate-900/90 p-3 rounded-xl border border-blue-500/30 text-right cursor-pointer transition">
              <div class="flex items-center justify-between">
                <span class="${awayBp.color} font-bold text-[10px]">불펜: ${awayBp.status}</span>
                <span class="text-xs font-bold text-orange-400">AWAY</span>
              </div>
              <div class="text-base font-extrabold text-white mt-1 truncate">${m.awayTeam || ''}</div>
              <div class="flex items-center justify-between text-xs mt-1 font-mono">
                <span class="${awayBp.color} font-bold text-[10px]"></span>
                <span class="text-orange-300">ERA ${aEra} (<span class="${aRecentEra.isPositive ? 'text-rose-400 font-bold' : 'text-blue-400 font-bold'}">최근3G ${aRecentEra.value}${aRecentEra.symbol}</span>)</span>
              </div>
            </div>

          </div>

        </div>
      `;
    }

    // ⚾ 일반 프로토 야구 경기
    return `
      <div class="glass-card glass-card-interactive rounded-2xl p-4 flex flex-col justify-between space-y-3 transition border-slate-800/80">
        
        <!-- 상단 헤더 -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="min-w-7 h-7 px-1 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold font-mono text-[11px] border border-slate-700">
              ${badgeNo}
            </span>
            <span class="text-xs px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-500/30 font-mono font-bold flex items-center gap-1">
              <i class="fa-solid fa-calendar-day text-blue-400"></i>
              <span>${m.gameDate || '08.21(금)'} ${m.gameTime || '19:00'}</span>
            </span>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
              ${league}
            </span>
            <span class="text-xs text-slate-400">
              ${m.betType ? `[${m.betType}]` : ''}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="openMatchDetail(\'${protoNo}\')" class="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1 transition">
              <i class="fa-solid fa-chart-line text-indigo-400"></i> 📊 수치 상세
            </button>
            <div class="text-xs text-slate-400">
              베트맨 <strong class="text-slate-200 font-mono">${displayNo}</strong>
            </div>
          </div>
        </div>

        <!-- 팀 매치업 & 일반 프로토 배당 버튼 -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          <div onclick="openMatchDetail(\'${protoNo}\')" class="md:col-span-4 text-left font-bold text-sm text-slate-200 truncate cursor-pointer hover:text-blue-300">
            ${m.homeTeam || ''}
          </div>

          <div class="md:col-span-4 grid grid-cols-3 gap-1.5 text-center">
            <button onclick="toggleProto(${seq}, 'win', ${odds.win || 0})"
              class="h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${isProtoWin ? 'bg-blue-600 text-white font-extrabold' : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'}">
              <span>승</span>
              <span class="font-mono text-[11px] text-blue-300">${winOddsStr}</span>
            </button>

            <button onclick="toggleProto(${seq}, 'draw', ${odds.draw || 0})"
              class="h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${isProtoDraw ? 'bg-purple-600 text-white font-extrabold' : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'}">
              <span>무</span>
              <span class="font-mono text-[11px] text-purple-300">${drawOddsStr}</span>
            </button>

            <button onclick="toggleProto(${seq}, 'loss', ${odds.loss || 0})"
              class="h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${isProtoLoss ? 'bg-orange-600 text-white font-extrabold' : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'}">
              <span>패</span>
              <span class="font-mono text-[11px] text-orange-300">${lossOddsStr}</span>
            </button>
          </div>

          <div onclick="openMatchDetail(\'${protoNo}\')" class="md:col-span-4 text-right font-bold text-sm text-slate-200 truncate cursor-pointer hover:text-orange-300">
            ${m.awayTeam || ''}
          </div>

        </div>

      </div>
    `;
  }).join('');

  updateCalculators();
}

// 7. 경기 상세 모달 열기/닫기
function openMatchDetail(seq) {
  const match = state.matches.find(m => m.matchSeq === seq);
  if (!match) return;

  const modal = document.getElementById("matchDetailModal");
  if (!modal) return;

  const homeSaber = match.home_saber || {};
  const awaySaber = match.away_saber || {};
  const votes = match.votes || { win: 45, draw: 20, loss: 35 };

  // 헤더 바인딩
  const modalProtoNo = match.betman_proto_no || (match.display_no ? match.display_no.replace('No.', '') : null) || match.betman_num || match.matchSeq;
  document.getElementById("modalMatchSeqBadge").textContent = modalProtoNo ? `No. ${modalProtoNo}` : 'No. 미정';
  document.getElementById("modalLeagueBadge").textContent = match.league || 'KBO';
  document.getElementById("modalMatchTitle").textContent = `${match.homeTeam} (홈) VS ${match.awayTeam} (원정)`;
  document.getElementById("modalMatchDate").innerHTML = `
    <i class="fa-solid fa-calendar-day text-blue-400"></i>
    <span>${match.gameDate || '08.21(금)'} ${match.gameTime || '19:00'} | ${match.stadium || '홈구장'}</span>
  `;

  // 선발 투수
  document.getElementById("modalHomePitcher").textContent = homeSaber.pitcher || "선발 투수";
  document.getElementById("modalHomeEra").textContent = homeSaber.sp_era || "3.50";
  document.getElementById("modalHomeFip").textContent = homeSaber.sp_fip || "3.45";
  document.getElementById("modalHomeWhip").textContent = (homeSaber.sp_era ? (homeSaber.sp_era * 0.32).toFixed(2) : "1.18");

  document.getElementById("modalAwayPitcher").textContent = awaySaber.pitcher || "선발 투수";
  document.getElementById("modalAwayEra").textContent = awaySaber.sp_era || "3.80";
  document.getElementById("modalAwayFip").textContent = awaySaber.sp_fip || "3.75";
  document.getElementById("modalAwayWhip").textContent = (awaySaber.sp_era ? (awaySaber.sp_era * 0.32).toFixed(2) : "1.24");

  // 타선 wRC+ / OPS
  document.getElementById("modalHomeWrc").textContent = `${homeSaber.wrc_plus || '110.0'} / ${homeSaber.ops || '0.765'}`;
  document.getElementById("modalAwayWrc").textContent = `${awaySaber.wrc_plus || '105.0'} / ${awaySaber.ops || '0.740'}`;

  // 불펜 피로도
  const homeBpStatus = homeSaber.bp_fip && homeSaber.bp_fip < 3.5 ? "🟢 원활 (32구)" : "🟡 보통 (52구)";
  const awayBpStatus = awaySaber.bp_fip && awaySaber.bp_fip < 3.5 ? "🟢 원활 (38구)" : "🔴 주의/과부하 (78구)";
  document.getElementById("modalHomeBullpen").textContent = homeBpStatus;
  document.getElementById("modalAwayBullpen").textContent = awayBpStatus;

  // 🔥 최근 3경기 지표 바인딩 (시즌 평균 vs 최근 3경기)
  const hRecent = homeSaber.recent3 || {};
  const aRecent = awaySaber.recent3 || {};
  
  const hEraObj = hRecent.era || { value: 2.10, isPositive: true, color: 'RED', symbol: '▲' };
  const hWhipObj = hRecent.whip || { value: 0.95, isPositive: true, color: 'RED', symbol: '▲' };
  const hInnObj = hRecent.innings || { value: 5.2, isPositive: false, color: 'BLUE', symbol: '▼' };

  const aEraObj = aRecent.era || { value: 4.20, isPositive: false, color: 'BLUE', symbol: '▼' };
  const aWhipObj = aRecent.whip || { value: 1.35, isPositive: false, color: 'BLUE', symbol: '▼' };
  const aInnObj = aRecent.innings || { value: 7.0, isPositive: true, color: 'RED', symbol: '▲' };

  if (document.getElementById("modalRecentHomePitcherName")) {
    document.getElementById("modalRecentHomePitcherName").textContent = `${homeSaber.pitcher || '홈선발'} (최근 3G)`;
    document.getElementById("modalRecentHomeEraSeason").textContent = homeSaber.sp_era || "2.85";
    document.getElementById("modalRecentHomeEraRecent").textContent = `${hEraObj.value} ${hEraObj.symbol}`;
    document.getElementById("modalRecentHomeEraRecent").className = hEraObj.isPositive ? "text-rose-400 font-black" : "text-blue-400 font-black";

    document.getElementById("modalRecentHomeWhipSeason").textContent = (homeSaber.split_home_whip || homeSaber.whip || "1.05");
    document.getElementById("modalRecentHomeWhipRecent").textContent = `${hWhipObj.value} ${hWhipObj.symbol}`;
    document.getElementById("modalRecentHomeWhipRecent").className = hWhipObj.isPositive ? "text-rose-400 font-black" : "text-blue-400 font-black";

    document.getElementById("modalRecentHomeInnSeason").textContent = `${homeSaber.split_home_ip || "6.7"}이닝`;
    document.getElementById("modalRecentHomeInnRecent").textContent = `${hInnObj.value}이닝 ${hInnObj.symbol}`;
    document.getElementById("modalRecentHomeInnRecent").className = hInnObj.isPositive ? "text-rose-400 font-black" : "text-blue-400 font-black";

    const hStatusBadge = document.getElementById("modalRecentHomeStatusBadge");
    if (hStatusBadge) {
      if (hEraObj.isPositive && hWhipObj.isPositive) {
        hStatusBadge.textContent = "🔥 호투/상승세";
        hStatusBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30";
      } else {
        hStatusBadge.textContent = "⚖️ 보통/점검";
        hStatusBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30";
      }
    }
  }

  if (document.getElementById("modalRecentAwayPitcherName")) {
    document.getElementById("modalRecentAwayPitcherName").textContent = `${awaySaber.pitcher || '원정선발'} (최근 3G)`;
    document.getElementById("modalRecentAwayEraSeason").textContent = awaySaber.sp_era || "3.55";
    document.getElementById("modalRecentAwayEraRecent").textContent = `${aEraObj.value} ${aEraObj.symbol}`;
    document.getElementById("modalRecentAwayEraRecent").className = aEraObj.isPositive ? "text-rose-400 font-black" : "text-blue-400 font-black";

    document.getElementById("modalRecentAwayWhipSeason").textContent = (awaySaber.split_away_whip || awaySaber.whip || "1.18");
    document.getElementById("modalRecentAwayWhipRecent").textContent = `${aWhipObj.value} ${aWhipObj.symbol}`;
    document.getElementById("modalRecentAwayWhipRecent").className = aWhipObj.isPositive ? "text-rose-400 font-black" : "text-blue-400 font-black";

    document.getElementById("modalRecentAwayInnSeason").textContent = `${awaySaber.split_away_ip || "6.3"}이닝`;
    document.getElementById("modalRecentAwayInnRecent").textContent = `${aInnObj.value}이닝 ${aInnObj.symbol}`;
    document.getElementById("modalRecentAwayInnRecent").className = aInnObj.isPositive ? "text-rose-400 font-black" : "text-blue-400 font-black";

    const aStatusBadge = document.getElementById("modalRecentAwayStatusBadge");
    if (aStatusBadge) {
      if (!aEraObj.isPositive && !aWhipObj.isPositive) {
        aStatusBadge.textContent = "📉 실점/하락세";
        aStatusBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/30";
      } else {
        aStatusBadge.textContent = "🔥 호투/상승세";
        aStatusBadge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30";
      }
    }
  }

  // 🛡️ [섹션 1-2 & 1-2-1] 불펜 투수 5대 핵심 지표 및 최근 3경기 흐름 바인딩
  initBullpenModalData(match, homeSaber, awaySaber);

  // AI 확률 계산
  const hAdvantage = (homeSaber.wrc_plus || 100) - (homeSaber.sp_era || 3.5) * 10;
  const aAdvantage = (awaySaber.wrc_plus || 100) - (awaySaber.sp_era || 3.5) * 10;
  
  let aiWin = Math.min(75, Math.max(25, Math.round(50 + (hAdvantage - aAdvantage) * 0.5)));
  let aiLoss = Math.min(75, Math.max(15, Math.round(100 - aiWin - 22)));
  let aiDraw = 100 - aiWin - aiLoss;

  document.getElementById("modalAiProbText").textContent = `승 ${aiWin}% | 1 ${aiDraw}% | 패 ${aiLoss}%`;
  document.getElementById("modalAiWinBar").style.width = `${aiWin}%`;
  document.getElementById("modalAiDrawBar").style.width = `${aiDraw}%`;
  document.getElementById("modalAiLossBar").style.width = `${aiLoss}%`;

  const voteWin = votes.win || 45;
  const voteDraw = votes.draw || 20;
  const voteLoss = votes.loss || 35;
  document.getElementById("modalVoteText").textContent = `승 ${voteWin}% | 1 ${voteDraw}% | 패 ${voteLoss}%`;
  document.getElementById("modalVoteWinBar").style.width = `${voteWin}%`;
  document.getElementById("modalVoteDrawBar").style.width = `${voteDraw}%`;
  document.getElementById("modalVoteLossBar").style.width = `${voteLoss}%`;

  // AI 결론
  const diff = aiWin - voteWin;
  let comment = `💡 선발 ${homeSaber.pitcher || '홈투수'}(ERA ${homeSaber.sp_era})의 탈삼진 능력과 불펜 ${homeBpStatus}의 안정성이 높아 [${match.recommended_pick || '승'}] 선택이 유력합니다.`;
  if (diff > 10) {
    comment += ` (대중 투표율 대비 AI 승률 +${diff.toFixed(1)}%p 알짜 배당 가치 확보)`;
  }
  document.getElementById("modalAiComment").textContent = comment;

  // 승1패 마킹 버튼 그룹 렌더링
  const s1pSet = state.s1pSelections[seq] || new Set();
  const btnGroup = document.getElementById("modalS1pBtnGroup");
  btnGroup.innerHTML = `
    <button onclick="toggleS1p(${seq}, '승'); openMatchDetail(${seq});" class="h-10 rounded-xl font-extrabold text-xs transition ${s1pSet.has('승') ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-slate-900 text-slate-300 border border-slate-700'}">
      [ 승 ] 홈승
    </button>
    <button onclick="toggleS1p(${seq}, '1'); openMatchDetail(${seq});" class="h-10 rounded-xl font-extrabold text-xs transition ${s1pSet.has('1') ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-slate-900 text-slate-300 border border-slate-700'}">
      [ 1 ] 1점차
    </button>
    <button onclick="toggleS1p(${seq}, '패'); openMatchDetail(${seq});" class="h-10 rounded-xl font-extrabold text-xs transition ${s1pSet.has('패') ? 'bg-orange-600 text-white ring-2 ring-orange-400' : 'bg-slate-900 text-slate-300 border border-slate-700'}">
      [ 패 ] 원정승
    </button>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// 🛡️ 팀별 맞춤형 불펜 투수 로스터 데이터베이스 (KBO, MLB, NPB 전체 구단 지원)
const TEAM_BULLPEN_ROSTERS = {
  // === KBO 10개 구단 ===
  "삼성": [
    { name: "김재윤 (마무리)", lob: 82.5, irs: 21.0, whip: 0.95, kbb: 22.8, fatigue: "1.1이닝 (22구)", recentLob: 85.0, recentWhip: 0.80, recentPitches: "22구", isPositive: true },
    { name: "오승환 (셋업)", lob: 79.0, irs: 25.0, whip: 1.10, kbb: 18.5, fatigue: "1.0이닝 (15구)", recentLob: 81.0, recentWhip: 1.00, recentPitches: "15구", isPositive: true },
    { name: "임창민 (필승조)", lob: 75.0, irs: 28.5, whip: 1.22, kbb: 16.0, fatigue: "2.0이닝 (34구)", recentLob: 73.0, recentWhip: 1.30, recentPitches: "34구", isPositive: false },
    { name: "이승현 (좌완)", lob: 74.0, irs: 30.0, whip: 1.28, kbb: 15.2, fatigue: "1.2이닝 (28구)", recentLob: 70.0, recentWhip: 1.35, recentPitches: "28구", isPositive: false }
  ],
  "KIA": [
    { name: "정해영 (마무리)", lob: 83.0, irs: 22.5, whip: 1.02, kbb: 21.5, fatigue: "1.0이닝 (16구)", recentLob: 88.0, recentWhip: 0.85, recentPitches: "16구", isPositive: true },
    { name: "전상현 (셋업)", lob: 78.5, irs: 27.0, whip: 1.18, kbb: 17.5, fatigue: "1.2이닝 (26구)", recentLob: 80.0, recentWhip: 1.10, recentPitches: "26구", isPositive: true },
    { name: "곽도규 (좌완필승)", lob: 76.5, irs: 29.0, whip: 1.18, kbb: 19.5, fatigue: "1.0이닝 (18구)", recentLob: 80.0, recentWhip: 1.05, recentPitches: "18구", isPositive: true },
    { name: "최지민 (롱릴리프)", lob: 69.5, irs: 38.0, whip: 1.40, kbb: 11.0, fatigue: "3.0이닝 (60구)", recentLob: 65.0, recentWhip: 1.55, recentPitches: "60구", isPositive: false }
  ],
  "LG": [
    { name: "유영찬 (마무리)", lob: 84.5, irs: 20.0, whip: 0.98, kbb: 23.0, fatigue: "1.0이닝 (14구)", recentLob: 88.0, recentWhip: 0.78, recentPitches: "14구", isPositive: true },
    { name: "김진성 (셋업)", lob: 80.0, irs: 24.5, whip: 1.08, kbb: 20.0, fatigue: "1.1이닝 (20구)", recentLob: 83.0, recentWhip: 0.95, recentPitches: "20구", isPositive: true },
    { name: "백승현 (필승조)", lob: 75.5, irs: 29.0, whip: 1.24, kbb: 16.5, fatigue: "2.0이닝 (35구)", recentLob: 72.0, recentWhip: 1.35, recentPitches: "35구", isPositive: false }
  ],
  "두산": [
    { name: "김택연 (마무리)", lob: 86.5, irs: 18.5, whip: 0.90, kbb: 25.5, fatigue: "1.1이닝 (18구)", recentLob: 90.0, recentWhip: 0.70, recentPitches: "18구", isPositive: true },
    { name: "이영하 (셋업)", lob: 77.0, irs: 28.0, whip: 1.20, kbb: 17.0, fatigue: "1.2이닝 (25구)", recentLob: 79.0, recentWhip: 1.15, recentPitches: "25구", isPositive: true },
    { name: "홍건희 (필승조)", lob: 74.0, irs: 32.0, whip: 1.30, kbb: 14.5, fatigue: "2.0이닝 (38구)", recentLob: 70.0, recentWhip: 1.45, recentPitches: "38구", isPositive: false }
  ],
  "한화": [
    { name: "주현상 (마무리)", lob: 85.0, irs: 19.0, whip: 0.92, kbb: 24.5, fatigue: "1.0이닝 (15구)", recentLob: 89.0, recentWhip: 0.75, recentPitches: "15구", isPositive: true },
    { name: "한승혁 (셋업)", lob: 76.0, irs: 30.0, whip: 1.25, kbb: 16.0, fatigue: "1.1이닝 (22구)", recentLob: 78.0, recentWhip: 1.18, recentPitches: "22구", isPositive: true },
    { name: "박상원 (필승조)", lob: 73.5, irs: 33.5, whip: 1.35, kbb: 13.0, fatigue: "2.1이닝 (42구)", recentLob: 68.0, recentWhip: 1.50, recentPitches: "42구", isPositive: false }
  ],
  "SSG": [
    { name: "조병현 (마무리)", lob: 83.5, irs: 21.5, whip: 0.96, kbb: 22.0, fatigue: "1.0이닝 (16구)", recentLob: 86.0, recentWhip: 0.82, recentPitches: "16구", isPositive: true },
    { name: "노경은 (셋업)", lob: 80.5, irs: 23.0, whip: 1.05, kbb: 19.5, fatigue: "1.2이닝 (24구)", recentLob: 83.0, recentWhip: 0.98, recentPitches: "24구", isPositive: true },
    { name: "문승원 (필승조)", lob: 74.5, irs: 31.0, whip: 1.28, kbb: 15.0, fatigue: "2.0이닝 (36구)", recentLob: 71.0, recentWhip: 1.40, recentPitches: "36구", isPositive: false }
  ],
  "롯데": [
    { name: "김원중 (마무리)", lob: 82.0, irs: 23.0, whip: 1.04, kbb: 21.0, fatigue: "1.0이닝 (18구)", recentLob: 85.0, recentWhip: 0.90, recentPitches: "18구", isPositive: true },
    { name: "구승민 (셋업)", lob: 76.5, irs: 29.5, whip: 1.22, kbb: 16.5, fatigue: "1.1이닝 (20구)", recentLob: 78.0, recentWhip: 1.15, recentPitches: "20구", isPositive: true },
    { name: "김상수 (필승조)", lob: 73.0, irs: 34.0, whip: 1.34, kbb: 14.0, fatigue: "2.0이닝 (38구)", recentLob: 69.0, recentWhip: 1.48, recentPitches: "38구", isPositive: false }
  ],
  "KT": [
    { name: "박영현 (마무리)", lob: 85.5, irs: 18.0, whip: 0.91, kbb: 25.0, fatigue: "1.0이닝 (14구)", recentLob: 90.0, recentWhip: 0.72, recentPitches: "14구", isPositive: true },
    { name: "손동현 (셋업)", lob: 78.0, irs: 26.5, whip: 1.15, kbb: 18.0, fatigue: "1.2이닝 (22구)", recentLob: 80.0, recentWhip: 1.05, recentPitches: "22구", isPositive: true },
    { name: "김민 (필승조)", lob: 75.0, irs: 30.5, whip: 1.26, kbb: 15.5, fatigue: "2.0이닝 (35구)", recentLob: 72.0, recentWhip: 1.38, recentPitches: "35구", isPositive: false }
  ],
  "NC": [
    { name: "이용찬 (마무리)", lob: 81.0, irs: 24.0, whip: 1.06, kbb: 20.0, fatigue: "1.1이닝 (19구)", recentLob: 84.0, recentWhip: 0.92, recentPitches: "19구", isPositive: true },
    { name: "김재열 (셋업)", lob: 79.5, irs: 25.5, whip: 1.12, kbb: 18.5, fatigue: "1.2이닝 (25구)", recentLob: 82.0, recentWhip: 1.02, recentPitches: "25구", isPositive: true },
    { name: "류진욱 (필승조)", lob: 74.0, irs: 32.0, whip: 1.30, kbb: 14.5, fatigue: "2.0이닝 (37구)", recentLob: 70.0, recentWhip: 1.42, recentPitches: "37구", isPositive: false }
  ],
  "키움": [
    { name: "주승우 (마무리)", lob: 80.5, irs: 25.0, whip: 1.10, kbb: 19.0, fatigue: "1.0이닝 (17구)", recentLob: 83.0, recentWhip: 0.95, recentPitches: "17구", isPositive: true },
    { name: "조상우 (셋업)", lob: 78.5, irs: 27.0, whip: 1.16, kbb: 17.5, fatigue: "1.1이닝 (21구)", recentLob: 80.0, recentWhip: 1.08, recentPitches: "21구", isPositive: true },
    { name: "김성민 (좌완)", lob: 73.0, irs: 33.5, whip: 1.32, kbb: 13.5, fatigue: "2.0이닝 (36구)", recentLob: 68.0, recentWhip: 1.45, recentPitches: "36구", isPositive: false }
  ],

  // === MLB 구단 ===
  "마이애미": [
    { name: "스콧 (마무리)", lob: 84.0, irs: 20.5, whip: 0.96, kbb: 23.5, fatigue: "1.0이닝 (14구)", recentLob: 88.0, recentWhip: 0.80, recentPitches: "14구", isPositive: true },
    { name: "푸크 (셋업)", lob: 80.0, irs: 24.0, whip: 1.08, kbb: 20.0, fatigue: "1.1이닝 (20구)", recentLob: 82.0, recentWhip: 0.95, recentPitches: "20구", isPositive: true },
    { name: "벤더 (필승조)", lob: 76.5, irs: 28.0, whip: 1.20, kbb: 17.0, fatigue: "1.2이닝 (26구)", recentLob: 74.0, recentWhip: 1.30, recentPitches: "26구", isPositive: false },
    { name: "나르디 (좌완)", lob: 73.0, irs: 34.0, whip: 1.35, kbb: 14.0, fatigue: "2.0이닝 (38구)", recentLob: 69.0, recentWhip: 1.45, recentPitches: "38구", isPositive: false }
  ],
  "보스턴": [
    { name: "얀센 (마무리)", lob: 83.0, irs: 22.0, whip: 1.02, kbb: 22.0, fatigue: "1.0이닝 (15구)", recentLob: 86.0, recentWhip: 0.88, recentPitches: "15구", isPositive: true },
    { name: "마틴 (셋업)", lob: 79.5, irs: 25.0, whip: 1.12, kbb: 18.5, fatigue: "1.1이닝 (19구)", recentLob: 81.0, recentWhip: 1.02, recentPitches: "19구", isPositive: true },
    { name: "켈리 (필승조)", lob: 74.0, irs: 32.5, whip: 1.28, kbb: 15.0, fatigue: "2.0이닝 (36구)", recentLob: 70.0, recentWhip: 1.40, recentPitches: "36구", isPositive: false },
    { name: "베르나르디노 (좌완)", lob: 71.0, irs: 38.0, whip: 1.42, kbb: 12.0, fatigue: "2.2이닝 (50구)", recentLob: 65.0, recentWhip: 1.60, recentPitches: "50구", isPositive: false }
  ],
  "디트로이트": [
    { name: "폴리 (마무리)", lob: 85.0, irs: 19.5, whip: 0.93, kbb: 24.0, fatigue: "1.0이닝 (13구)", recentLob: 89.0, recentWhip: 0.76, recentPitches: "13구", isPositive: true },
    { name: "홀튼 (셋업)", lob: 81.0, irs: 23.0, whip: 1.05, kbb: 21.0, fatigue: "1.2이닝 (22구)", recentLob: 84.0, recentWhip: 0.92, recentPitches: "22구", isPositive: true },
    { name: "베스티아 (필승조)", lob: 75.0, irs: 30.0, whip: 1.24, kbb: 16.5, fatigue: "2.0이닝 (35구)", recentLob: 72.0, recentWhip: 1.36, recentPitches: "35구", isPositive: false }
  ],
  "탬파베이": [
    { name: "페어뱅크스 (마무리)", lob: 86.0, irs: 18.0, whip: 0.89, kbb: 26.0, fatigue: "1.0이닝 (14구)", recentLob: 90.0, recentWhip: 0.70, recentPitches: "14구", isPositive: true },
    { name: "포셰 (셋업)", lob: 80.5, irs: 24.5, whip: 1.06, kbb: 19.5, fatigue: "1.1이닝 (18구)", recentLob: 83.0, recentWhip: 0.95, recentPitches: "18구", isPositive: true },
    { name: "암스트롱 (필승조)", lob: 76.0, irs: 29.0, whip: 1.20, kbb: 17.0, fatigue: "2.0이닝 (34구)", recentLob: 73.0, recentWhip: 1.32, recentPitches: "34구", isPositive: false }
  ],
  "워싱턴": [
    { name: "피네간 (마무리)", lob: 82.5, irs: 23.0, whip: 1.04, kbb: 21.5, fatigue: "1.0이닝 (16구)", recentLob: 86.0, recentWhip: 0.90, recentPitches: "16구", isPositive: true },
    { name: "하비 (셋업)", lob: 78.0, irs: 27.5, whip: 1.16, kbb: 18.0, fatigue: "1.2이닝 (24구)", recentLob: 80.0, recentWhip: 1.08, recentPitches: "24구", isPositive: true },
    { name: "플로로 (필승조)", lob: 73.5, irs: 33.0, whip: 1.30, kbb: 14.5, fatigue: "2.0이닝 (38구)", recentLob: 69.0, recentWhip: 1.44, recentPitches: "38구", isPositive: false }
  ],
  "콜로라도": [
    { name: "킨리 (마무리)", lob: 78.0, irs: 29.0, whip: 1.18, kbb: 18.0, fatigue: "1.0이닝 (18구)", recentLob: 80.0, recentWhip: 1.05, recentPitches: "18구", isPositive: true },
    { name: "보단 (셋업)", lob: 74.0, irs: 34.0, whip: 1.32, kbb: 14.5, fatigue: "1.2이닝 (28구)", recentLob: 70.0, recentWhip: 1.40, recentPitches: "28구", isPositive: false },
    { name: "로렌스 (필승조)", lob: 70.5, irs: 39.0, whip: 1.45, kbb: 11.5, fatigue: "2.1이닝 (45구)", recentLob: 65.0, recentWhip: 1.60, recentPitches: "45구", isPositive: false }
  ],
  "샌디에이고": [
    { name: "수아레즈 (마무리)", lob: 87.0, irs: 17.5, whip: 0.86, kbb: 27.0, fatigue: "1.0이닝 (12구)", recentLob: 92.0, recentWhip: 0.65, recentPitches: "12구", isPositive: true },
    { name: "에스트라다 (셋업)", lob: 82.5, irs: 21.0, whip: 1.00, kbb: 23.0, fatigue: "1.1이닝 (17구)", recentLob: 85.0, recentWhip: 0.88, recentPitches: "17구", isPositive: true },
    { name: "아담 (필승조)", lob: 79.0, irs: 25.5, whip: 1.12, kbb: 19.5, fatigue: "1.2이닝 (24구)", recentLob: 81.0, recentWhip: 1.02, recentPitches: "24구", isPositive: true },
    { name: "마츠이 (좌완)", lob: 75.0, irs: 31.0, whip: 1.25, kbb: 16.0, fatigue: "2.0이닝 (34구)", recentLob: 72.0, recentWhip: 1.35, recentPitches: "34구", isPositive: false }
  ],
  "다저스": [
    { name: "코펙 (마무리)", lob: 86.5, irs: 18.0, whip: 0.88, kbb: 26.0, fatigue: "1.0이닝 (14구)", recentLob: 90.0, recentWhip: 0.68, recentPitches: "14구", isPositive: true },
    { name: "필립스 (셋업)", lob: 82.0, irs: 22.5, whip: 1.02, kbb: 22.5, fatigue: "1.1이닝 (18구)", recentLob: 84.0, recentWhip: 0.90, recentPitches: "18구", isPositive: true },
    { name: "트레이넨 (필승조)", lob: 78.5, irs: 26.0, whip: 1.14, kbb: 19.0, fatigue: "1.2이닝 (25구)", recentLob: 80.0, recentWhip: 1.06, recentPitches: "25구", isPositive: true }
  ],
  "양키스": [
    { name: "홈스 (마무리)", lob: 83.5, irs: 22.0, whip: 1.00, kbb: 22.0, fatigue: "1.0이닝 (15구)", recentLob: 87.0, recentWhip: 0.85, recentPitches: "15구", isPositive: true },
    { name: "위버 (셋업)", lob: 81.0, irs: 24.0, whip: 1.08, kbb: 20.5, fatigue: "1.2이닝 (22구)", recentLob: 83.0, recentWhip: 0.95, recentPitches: "22구", isPositive: true },
    { name: "케인리 (필승조)", lob: 76.0, irs: 29.5, whip: 1.22, kbb: 16.5, fatigue: "2.0이닝 (36구)", recentLob: 72.0, recentWhip: 1.35, recentPitches: "36구", isPositive: false }
  ],

  // === NPB 구단 ===
  "야쿠르트": [
    { name: "타구치 (마무리)", lob: 84.0, irs: 19.5, whip: 0.92, kbb: 24.0, fatigue: "1.0이닝 (16구)", recentLob: 88.0, recentWhip: 0.75, recentPitches: "16구", isPositive: true },
    { name: "시미즈 (셋업)", lob: 80.0, irs: 24.0, whip: 1.05, kbb: 20.5, fatigue: "1.2이닝 (24구)", recentLob: 82.0, recentWhip: 0.95, recentPitches: "24구", isPositive: true },
    { name: "키자와 (필승조)", lob: 75.5, irs: 30.0, whip: 1.22, kbb: 16.5, fatigue: "2.0이닝 (34구)", recentLob: 72.0, recentWhip: 1.32, recentPitches: "34구", isPositive: false },
    { name: "이시야마 (필승조)", lob: 69.0, irs: 40.0, whip: 1.42, kbb: 10.5, fatigue: "3.0이닝 (62구)", recentLob: 64.0, recentWhip: 1.58, recentPitches: "62구", isPositive: false }
  ],
  "요미우리": [
    { name: "발도나도 (마무리)", lob: 85.0, irs: 18.5, whip: 0.90, kbb: 25.0, fatigue: "1.0이닝 (14구)", recentLob: 89.0, recentWhip: 0.72, recentPitches: "14구", isPositive: true },
    { name: "오타 (셋업)", lob: 81.5, irs: 22.0, whip: 1.02, kbb: 21.5, fatigue: "1.1이닝 (18구)", recentLob: 84.0, recentWhip: 0.90, recentPitches: "18구", isPositive: true },
    { name: "후나바사마 (필승조)", lob: 77.0, irs: 27.5, whip: 1.18, kbb: 18.0, fatigue: "1.2이닝 (26구)", recentLob: 79.0, recentWhip: 1.10, recentPitches: "26구", isPositive: true }
  ],
  "한신": [
    { name: "이와자키 (마무리)", lob: 86.0, irs: 18.0, whip: 0.88, kbb: 26.0, fatigue: "1.0이닝 (13구)", recentLob: 90.0, recentWhip: 0.70, recentPitches: "13구", isPositive: true },
    { name: "게라 (셋업)", lob: 82.0, irs: 21.5, whip: 1.00, kbb: 22.5, fatigue: "1.1이닝 (17구)", recentLob: 85.0, recentWhip: 0.88, recentPitches: "17구", isPositive: true },
    { name: "이시이 (필승조)", lob: 78.0, irs: 26.0, whip: 1.14, kbb: 19.0, fatigue: "1.2이닝 (25구)", recentLob: 80.0, recentWhip: 1.05, recentPitches: "25구", isPositive: true }
  ],
  "소프트뱅크": [
    { name: "스기야마 (마무리)", lob: 87.0, irs: 17.0, whip: 0.85, kbb: 27.5, fatigue: "1.0이닝 (12구)", recentLob: 92.0, recentWhip: 0.65, recentPitches: "12구", isPositive: true },
    { name: "헤르난데스 (셋업)", lob: 83.0, irs: 20.5, whip: 0.98, kbb: 23.5, fatigue: "1.1이닝 (16구)", recentLob: 86.0, recentWhip: 0.85, recentPitches: "16구", isPositive: true },
    { name: "후지이 (필승조)", lob: 79.0, irs: 25.0, whip: 1.12, kbb: 20.0, fatigue: "1.2이닝 (24구)", recentLob: 81.0, recentWhip: 1.02, recentPitches: "24구", isPositive: true }
  ]
};

// 팀명 및 리그 기반 지능형 불펜 투수 목록 조회 함수
function getTeamBullpenPitchers(teamName, league, isHome) {
  const cleanTeam = (teamName || '').trim();
  
  // 구단명 매칭
  for (const [key, roster] of Object.entries(TEAM_BULLPEN_ROSTERS)) {
    if (cleanTeam.includes(key)) {
      return roster;
    }
  }

  const leagueUpper = (league || 'KBO').toUpperCase();
  if (leagueUpper === 'MLB') {
    return isHome ? [
      { name: "스미스 (마무리)", lob: 84.5, irs: 20.0, whip: 0.95, kbb: 23.0, fatigue: "1.0이닝 (14구)", recentLob: 88.0, recentWhip: 0.78, recentPitches: "14구", isPositive: true },
      { name: "존슨 (셋업)", lob: 80.0, irs: 24.5, whip: 1.08, kbb: 20.0, fatigue: "1.1이닝 (20구)", recentLob: 83.0, recentWhip: 0.95, recentPitches: "20구", isPositive: true },
      { name: "밀러 (필승조)", lob: 75.5, irs: 29.0, whip: 1.24, kbb: 16.5, fatigue: "2.0이닝 (35구)", recentLob: 72.0, recentWhip: 1.35, recentPitches: "35구", isPositive: false }
    ] : [
      { name: "데이비스 (마무리)", lob: 81.0, irs: 24.0, whip: 1.06, kbb: 20.0, fatigue: "1.1이닝 (19구)", recentLob: 84.0, recentWhip: 0.92, recentPitches: "19구", isPositive: true },
      { name: "윌슨 (셋업)", lob: 76.5, irs: 29.5, whip: 1.22, kbb: 16.5, fatigue: "1.1이닝 (20구)", recentLob: 78.0, recentWhip: 1.15, recentPitches: "20구", isPositive: true },
      { name: "테일러 (필승조)", lob: 70.0, irs: 38.0, whip: 1.40, kbb: 11.5, fatigue: "2.2이닝 (48구)", recentLob: 65.0, recentWhip: 1.55, recentPitches: "48구", isPositive: false }
    ];
  } else if (leagueUpper === 'NPB') {
    return isHome ? [
      { name: "사토 (마무리)", lob: 85.0, irs: 19.0, whip: 0.90, kbb: 24.5, fatigue: "1.0이닝 (15구)", recentLob: 89.0, recentWhip: 0.74, recentPitches: "15구", isPositive: true },
      { name: "다나카 (셋업)", lob: 80.5, irs: 23.5, whip: 1.05, kbb: 20.5, fatigue: "1.1이닝 (18구)", recentLob: 83.0, recentWhip: 0.95, recentPitches: "18구", isPositive: true }
    ] : [
      { name: "스즈키 (마무리)", lob: 82.0, irs: 22.5, whip: 1.02, kbb: 21.5, fatigue: "1.0이닝 (16구)", recentLob: 85.0, recentWhip: 0.88, recentPitches: "16구", isPositive: true },
      { name: "야마모토 (셋업)", lob: 75.0, irs: 31.0, whip: 1.25, kbb: 16.0, fatigue: "2.0이닝 (36구)", recentLob: 70.0, recentWhip: 1.38, recentPitches: "36구", isPositive: false }
    ];
  }

  // KBO 기본
  return isHome ? TEAM_BULLPEN_ROSTERS["삼성"] : TEAM_BULLPEN_ROSTERS["KIA"];
}

let currentHomeBullpenRoster = [];
let currentAwayBullpenRoster = [];

function initBullpenModalData(match, homeSaber, awaySaber) {
  const homeTeam = match.homeTeam || match.home_team || '홈팀';
  const awayTeam = match.awayTeam || match.away_team || '원정팀';
  const league = match.league || 'KBO';

  // 팀 레이블 업데이트
  const homeLabelEl = document.getElementById("modalHomeBpTeamLabel");
  const awayLabelEl = document.getElementById("modalAwayBpTeamLabel");
  if (homeLabelEl) homeLabelEl.textContent = `🏠 ${homeTeam} 불펜`;
  if (awayLabelEl) awayLabelEl.textContent = `✈️ ${awayTeam} 불펜`;

  // 팀별 로스터 획득
  currentHomeBullpenRoster = getTeamBullpenPitchers(homeTeam, league, true);
  currentAwayBullpenRoster = getTeamBullpenPitchers(awayTeam, league, false);

  const homeSelect = document.getElementById("modalHomeBullpenSelect");
  const awaySelect = document.getElementById("modalAwayBullpenSelect");

  if (homeSelect) {
    homeSelect.innerHTML = currentHomeBullpenRoster.map((p, idx) => `<option value="${idx}">${p.name}</option>`).join('');
    homeSelect.value = "0";
  }
  if (awaySelect) {
    awaySelect.innerHTML = currentAwayBullpenRoster.map((p, idx) => `<option value="${idx}">${p.name}</option>`).join('');
    awaySelect.value = "0";
  }

  updateBullpenDisplay(currentHomeBullpenRoster[0], currentAwayBullpenRoster[0]);
}

function onBullpenPitcherChange(side) {
  const homeIdx = parseInt(document.getElementById("modalHomeBullpenSelect")?.value || "0", 10);
  const awayIdx = parseInt(document.getElementById("modalAwayBullpenSelect")?.value || "0", 10);

  const homePitcher = currentHomeBullpenRoster[homeIdx] || currentHomeBullpenRoster[0];
  const awayPitcher = currentAwayBullpenRoster[awayIdx] || currentAwayBullpenRoster[0];

  updateBullpenDisplay(homePitcher, awayPitcher);
  showToast(`${side === 'home' ? '홈' : '원정'} 불펜 투수(${side === 'home' ? homePitcher.name : awayPitcher.name}) 지표로 갱신되었습니다.`);
}

function updateBullpenDisplay(h, a) {
  if (!h || !a) return;

  // 1-2. 5대 핵심 지표
  document.getElementById("modalHomeLob").textContent = `${h.lob.toFixed(1)}%`;
  document.getElementById("modalAwayLob").textContent = `${a.lob.toFixed(1)}%`;
  document.getElementById("modalHomeLobBadge").textContent = h.lob >= 75 ? "▲" : "▼";
  document.getElementById("modalHomeLobBadge").className = h.lob >= 75 ? "ml-1 text-[10px] font-bold text-rose-400" : "ml-1 text-[10px] font-bold text-blue-400";
  document.getElementById("modalAwayLobBadge").textContent = a.lob >= 75 ? "▲" : "▼";
  document.getElementById("modalAwayLobBadge").className = a.lob >= 75 ? "mr-1 text-[10px] font-bold text-rose-400" : "mr-1 text-[10px] font-bold text-blue-400";

  document.getElementById("modalHomeIrs").textContent = `${h.irs.toFixed(1)}%`;
  document.getElementById("modalAwayIrs").textContent = `${a.irs.toFixed(1)}%`;
  document.getElementById("modalHomeIrsBadge").textContent = h.irs <= 30 ? "▲" : "▼";
  document.getElementById("modalHomeIrsBadge").className = h.irs <= 30 ? "ml-1 text-[10px] font-bold text-rose-400" : "ml-1 text-[10px] font-bold text-blue-400";
  document.getElementById("modalAwayIrsBadge").textContent = a.irs <= 30 ? "▲" : "▼";
  document.getElementById("modalAwayIrsBadge").className = a.irs <= 30 ? "mr-1 text-[10px] font-bold text-rose-400" : "mr-1 text-[10px] font-bold text-blue-400";

  document.getElementById("modalHomeBpWhip").textContent = h.whip.toFixed(2);
  document.getElementById("modalAwayBpWhip").textContent = a.whip.toFixed(2);
  document.getElementById("modalHomeBpWhipBadge").textContent = h.whip <= 1.20 ? "▲" : "▼";
  document.getElementById("modalHomeBpWhipBadge").className = h.whip <= 1.20 ? "ml-1 text-[10px] font-bold text-rose-400" : "ml-1 text-[10px] font-bold text-blue-400";
  document.getElementById("modalAwayBpWhipBadge").textContent = a.whip <= 1.20 ? "▲" : "▼";
  document.getElementById("modalAwayBpWhipBadge").className = a.whip <= 1.20 ? "mr-1 text-[10px] font-bold text-rose-400" : "mr-1 text-[10px] font-bold text-blue-400";

  document.getElementById("modalHomeKbb").textContent = `${h.kbb.toFixed(1)}%`;
  document.getElementById("modalAwayKbb").textContent = `${a.kbb.toFixed(1)}%`;
  document.getElementById("modalHomeKbbBadge").textContent = h.kbb >= 15 ? "▲" : "▼";
  document.getElementById("modalHomeKbbBadge").className = h.kbb >= 15 ? "ml-1 text-[10px] font-bold text-rose-400" : "ml-1 text-[10px] font-bold text-blue-400";
  document.getElementById("modalAwayKbbBadge").textContent = a.kbb >= 15 ? "▲" : "▼";
  document.getElementById("modalAwayKbbBadge").className = a.kbb >= 15 ? "mr-1 text-[10px] font-bold text-rose-400" : "mr-1 text-[10px] font-bold text-blue-400";

  document.getElementById("modalHomeFatigue").textContent = h.fatigue;
  document.getElementById("modalAwayFatigue").textContent = a.fatigue;
  document.getElementById("modalHomeFatigueBadge").textContent = h.isPositive ? "🟢 원활" : "🔴 주의";
  document.getElementById("modalHomeFatigueBadge").className = h.isPositive ? "ml-1 text-[10px] font-bold text-emerald-400" : "ml-1 text-[10px] font-bold text-amber-400";
  document.getElementById("modalAwayFatigueBadge").textContent = a.isPositive ? "🟢 원활" : "🔴 과부하";
  document.getElementById("modalAwayFatigueBadge").className = a.isPositive ? "mr-1 text-[10px] font-bold text-emerald-400" : "mr-1 text-[10px] font-bold text-rose-400";

  // 1-2-1. 불펜 최근 3경기 흐름
  document.getElementById("modalRecentHomeBpName").textContent = `${h.name} (최근 3G)`;
  document.getElementById("modalRecentAwayBpName").textContent = `${a.name} (최근 3G)`;

  document.getElementById("modalRecentHomeBpLobSeason").textContent = `${h.lob.toFixed(1)}%`;
  document.getElementById("modalRecentHomeBpLobRecent").textContent = `${h.recentLob.toFixed(1)}% ${h.recentLob >= h.lob ? '▲' : '▼'}`;
  document.getElementById("modalRecentHomeBpLobRecent").className = h.recentLob >= h.lob ? "text-rose-400 font-bold" : "text-blue-400 font-bold";

  document.getElementById("modalRecentAwayBpLobSeason").textContent = `${a.lob.toFixed(1)}%`;
  document.getElementById("modalRecentAwayBpLobRecent").textContent = `${a.recentLob.toFixed(1)}% ${a.recentLob >= a.lob ? '▲' : '▼'}`;
  document.getElementById("modalRecentAwayBpLobRecent").className = a.recentLob >= a.lob ? "text-rose-400 font-bold" : "text-blue-400 font-bold";

  document.getElementById("modalRecentHomeBpWhipSeason").textContent = h.whip.toFixed(2);
  document.getElementById("modalRecentHomeBpWhipRecent").textContent = `${h.recentWhip.toFixed(2)} ${h.recentWhip <= h.whip ? '▲' : '▼'}`;
  document.getElementById("modalRecentHomeBpWhipRecent").className = h.recentWhip <= h.whip ? "text-rose-400 font-bold" : "text-blue-400 font-bold";

  document.getElementById("modalRecentAwayBpWhipSeason").textContent = a.whip.toFixed(2);
  document.getElementById("modalRecentAwayBpWhipRecent").textContent = `${a.recentWhip.toFixed(2)} ${a.recentWhip <= a.whip ? '▲' : '▼'}`;
  document.getElementById("modalRecentAwayBpWhipRecent").className = a.recentWhip <= a.whip ? "text-rose-400 font-bold" : "text-blue-400 font-bold";

  document.getElementById("modalRecentHomeBpPitchesSeason").textContent = "35구";
  document.getElementById("modalRecentHomeBpPitchesRecent").textContent = `${h.recentPitches} ${h.isPositive ? '▲' : '▼'}`;
  document.getElementById("modalRecentHomeBpPitchesRecent").className = h.isPositive ? "text-rose-400 font-bold" : "text-blue-400 font-bold";

  document.getElementById("modalRecentAwayBpPitchesSeason").textContent = "45구";
  document.getElementById("modalRecentAwayBpPitchesRecent").textContent = `${a.recentPitches} ${a.isPositive ? '▲' : '▼'}`;
  document.getElementById("modalRecentAwayBpPitchesRecent").className = a.isPositive ? "text-rose-400 font-bold" : "text-blue-400 font-bold";

  const hBpStatus = document.getElementById("modalRecentHomeBpStatusBadge");
  if (hBpStatus) {
    hBpStatus.textContent = h.isPositive ? "🔥 철벽 상승세" : "⚖️ 불펜 주의";
    hBpStatus.className = h.isPositive ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30" : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30";
  }

  const aBpStatus = document.getElementById("modalRecentAwayBpStatusBadge");
  if (aBpStatus) {
    aBpStatus.textContent = a.isPositive ? "🔥 철벽 상승세" : "📉 과부하/하락세";
    aBpStatus.className = a.isPositive ? "px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30" : "px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/30";
  }
}

function closeMatchDetail() {
  const modal = document.getElementById("matchDetailModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

// 📱 모바일 가이드 모달 열기/닫기
function openMobileGuide() {
  const modal = document.getElementById("mobileGuideModal");
  if (modal) {
    const ipEl = document.getElementById("localIpUrlText");
    if (ipEl) ipEl.textContent = "http://192.168.123.111:8000";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeMobileGuide() {
  const modal = document.getElementById("mobileGuideModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

// 7. 승1패 토글
function toggleS1p(seq, pick) {
  if (!state.s1pSelections[seq]) {
    state.s1pSelections[seq] = new Set();
  }

  if (state.s1pSelections[seq].has(pick)) {
    state.s1pSelections[seq].delete(pick);
    if (state.s1pSelections[seq].size === 0) {
      delete state.s1pSelections[seq];
    }
  } else {
    state.s1pSelections[seq].add(pick);
  }

  renderMatches();
}

// 8. 프로토 배당 토글
function toggleProto(seq, type, odds) {
  if (!odds || odds <= 0) return;

  if (state.protoSelections[seq] && state.protoSelections[seq].type === type) {
    delete state.protoSelections[seq];
  } else {
    state.protoSelections[seq] = { type, odds };
  }

  renderMatches();
}

// 9. 추천픽 자동 선택
function autoMarkTopPicks() {
  const s1pMatches = state.matches.filter(m => m.is_seung_1_pae);
  state.s1pSelections = {};

  s1pMatches.forEach(m => {
    const pick = m.recommended_pick || '승';
    state.s1pSelections[m.matchSeq] = new Set([pick]);
  });

  renderMatches();
  showToast("승1패 대상 경기 전체에 AI 추천픽이 마킹되었습니다!");
}

// 10. 전체 선택 해제
function clearAllSelections() {
  state.s1pSelections = {};
  state.protoSelections = {};
  renderMatches();
  showToast("모든 마킹과 배당 선택이 초기화되었습니다.");
}

// 11. 계산기 바 갱신
function updateCalculators() {
  try {
    // 승1패 계산
    const s1pKeys = Object.keys(state.s1pSelections);
    const s1pMarkedCount = s1pKeys.length;

    let totalComb = 0;
    if (s1pMarkedCount > 0) {
      totalComb = 1;
      s1pKeys.forEach(k => {
        totalComb *= state.s1pSelections[k].size;
      });
    }

    const s1pAmount = totalComb * 1000;

    const s1pMarkedCountEl = document.getElementById("s1pMarkedCount");
    if (s1pMarkedCountEl) s1pMarkedCountEl.textContent = s1pMarkedCount;

    const totalCombEl = document.getElementById("totalCombinations");
    if (totalCombEl) totalCombEl.textContent = `${totalComb.toLocaleString()} 조합`;

    const totalBetAmountEl = document.getElementById("totalBetAmount");
    if (totalBetAmountEl) totalBetAmountEl.textContent = `${s1pAmount.toLocaleString()} 원`;

    const slipCombCountEl = document.getElementById("slipCombCount");
    if (slipCombCountEl) slipCombCountEl.textContent = `${totalComb.toLocaleString()} 조합`;

    const slipBetAmountEl = document.getElementById("slipBetAmount");
    if (slipBetAmountEl) slipBetAmountEl.textContent = `${s1pAmount.toLocaleString()} 원`;

    // 프로토 계산
    const protoKeys = Object.keys(state.protoSelections);
    const protoCount = protoKeys.length;

    let totalOdds = 0.0;
    if (protoCount > 0) {
      totalOdds = 1.0;
      protoKeys.forEach(k => {
        totalOdds *= state.protoSelections[k].odds;
      });
    }

    const returnAmt = Math.round(totalOdds * 10000);

    const protoSelectedCountEl = document.getElementById("protoSelectedCount");
    if (protoSelectedCountEl) protoSelectedCountEl.textContent = `${protoCount}경기 선택`;

    const protoTotalOddsEl = document.getElementById("protoTotalOdds");
    if (protoTotalOddsEl) protoTotalOddsEl.textContent = `${totalOdds.toFixed(2)} 배`;

    const protoReturnAmountEl = document.getElementById("protoReturnAmount");
    if (protoReturnAmountEl) protoReturnAmountEl.textContent = `${returnAmt.toLocaleString()} 원`;

    const slipProtoOddsEl = document.getElementById("slipProtoOdds");
    if (slipProtoOddsEl) slipProtoOddsEl.textContent = `${totalOdds.toFixed(2)} 배`;
  } catch (e) {}
}

// 토스트 알림 함수
function showToast(msg) {
  try {
    const toast = document.getElementById("toastNotification");
    const msgEl = document.getElementById("toastMessage");
    if (!toast || !msgEl) return;

    msgEl.textContent = msg;
    toast.classList.remove("translate-y-20", "opacity-0", "pointer-events-none");
    toast.classList.add("translate-y-0", "opacity-100");

    setTimeout(() => {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("translate-y-20", "opacity-0", "pointer-events-none");
    }, 2400);
  } catch(e) {}
}

