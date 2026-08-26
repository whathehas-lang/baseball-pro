import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/match_model.dart';

class MatchProvider with ChangeNotifier {
  List<MatchModel> _matches = [
    // --- MLB 10경기 (No.6215 ~ No.6260) : 각 경기별 개별 세이버메트릭스 수치 지정 ---
    const MatchModel(
      id: '6215', betmanProtoNo: '6215', displayNo: '#No.6215', league: 'MLB', gameTime: '07:40', gameDate: '08.25(화)',
      homeTeam: '마이애미 말린스', awayTeam: '보스턴 레드삭스', homeStarter: '알칸타라', awayStarter: '수아레즈',
      homeEra: 3.42, awayEra: 3.75, homeWhip: 1.12, awayWhip: 1.22, homeOps: 0.770, awayOps: 0.735,
      homeWrcPlus: 112, awayWrcPlus: 105, aiPrediction: '승', stadium: '론디포 파크',
    ),
    const MatchModel(
      id: '6220', betmanProtoNo: '6220', displayNo: '#No.6220', league: 'MLB', gameTime: '07:40', gameDate: '08.25(화)',
      homeTeam: '디트로이트 타이거스', awayTeam: '탬파베이 레이스', homeStarter: '발데스', awayStarter: '라스무센',
      homeEra: 3.35, awayEra: 3.80, homeWhip: 1.10, awayWhip: 1.25, homeOps: 0.760, awayOps: 0.730,
      homeWrcPlus: 110, awayWrcPlus: 104, aiPrediction: '승', stadium: '코메리카 파크',
    ),
    const MatchModel(
      id: '6225', betmanProtoNo: '6225', displayNo: '#No.6225', league: 'MLB', gameTime: '07:45', gameDate: '08.25(화)',
      homeTeam: '워싱턴 내셔널스', awayTeam: '콜로라도 로키스', homeStarter: '카발리', awayStarter: '펠트너',
      homeEra: 3.50, awayEra: 4.20, homeWhip: 1.15, awayWhip: 1.35, homeOps: 0.755, awayOps: 0.710,
      homeWrcPlus: 108, awayWrcPlus: 98, aiPrediction: '승', stadium: '내셔널스 파크',
    ),
    const MatchModel(
      id: '6230', betmanProtoNo: '6230', displayNo: '#No.6230', league: 'MLB', gameTime: '08:40', gameDate: '08.25(화)',
      homeTeam: '시카고 화이트삭스', awayTeam: '텍사스 레인저스', homeStarter: '크로셰', awayStarter: '이발디',
      homeEra: 3.25, awayEra: 3.45, homeWhip: 1.08, awayWhip: 1.12, homeOps: 0.690, awayOps: 0.775,
      homeWrcPlus: 92, awayWrcPlus: 114, aiPrediction: '패', stadium: '개런티드 레이트 필드',
    ),
    const MatchModel(
      id: '6235', betmanProtoNo: '6235', displayNo: '#No.6235', league: 'MLB', gameTime: '10:38', gameDate: '08.25(화)',
      homeTeam: 'LA 에인절스', awayTeam: '클리블랜드 가디언스', homeStarter: '앤더슨', awayStarter: '바이비',
      homeEra: 3.65, awayEra: 3.55, homeWhip: 1.20, awayWhip: 1.14, homeOps: 0.730, awayOps: 0.745,
      homeWrcPlus: 102, awayWrcPlus: 108, aiPrediction: '승', stadium: '에인절 스타디움',
    ),
    const MatchModel(
      id: '6240', betmanProtoNo: '6240', displayNo: '#No.6240', league: 'MLB', gameTime: '10:40', gameDate: '08.25(화)',
      homeTeam: '애리조나 다이아몬드백스', awayTeam: '시카고 컵스', homeStarter: '갤런', awayStarter: '이마нага',
      homeEra: 3.30, awayEra: 3.15, homeWhip: 1.10, awayWhip: 1.04, homeOps: 0.780, awayOps: 0.740,
      homeWrcPlus: 116, awayWrcPlus: 106, aiPrediction: '승', stadium: '체이스 필드',
    ),
    const MatchModel(
      id: '6245', betmanProtoNo: '6245', displayNo: '#No.6245', league: 'MLB', gameTime: '10:40', gameDate: '08.25(화)',
      homeTeam: '오클랜드 애슬레틱스', awayTeam: '미네소타 트윈스', homeStarter: '시어스', awayStarter: '로페즈',
      homeEra: 4.10, awayEra: 3.60, homeWhip: 1.25, awayWhip: 1.12, homeOps: 0.715, awayOps: 0.755,
      homeWrcPlus: 98, awayWrcPlus: 110, aiPrediction: '패', stadium: '오클랜드 콜리세움',
    ),
    const MatchModel(
      id: '6250', betmanProtoNo: '6250', displayNo: '#No.6250', league: 'MLB', gameTime: '10:40', gameDate: '08.25(화)',
      homeTeam: '시애틀 매리너스', awayTeam: '필라델피아 필리스', homeStarter: '커비', awayStarter: '휠러',
      homeEra: 3.20, awayEra: 2.85, homeWhip: 1.02, awayWhip: 1.00, homeOps: 0.730, awayOps: 0.785,
      homeWrcPlus: 105, awayWrcPlus: 118, aiPrediction: '승', stadium: 'T-모바일 파크',
    ),
    const MatchModel(
      id: '6255', betmanProtoNo: '6255', displayNo: '#No.6255', league: 'MLB', gameTime: '10:40', gameDate: '08.25(화)',
      homeTeam: '볼티모어 오리올스', awayTeam: '뉴욕 양키스', homeStarter: '번스', awayStarter: '콜',
      homeEra: 3.10, awayEra: 3.20, homeWhip: 1.06, awayWhip: 1.08, homeOps: 0.775, awayOps: 0.790,
      homeWrcPlus: 115, awayWrcPlus: 120, aiPrediction: '승', stadium: '오리올 파크',
    ),
    const MatchModel(
      id: '6260', betmanProtoNo: '6260', displayNo: '#No.6260', league: 'MLB', gameTime: '10:45', gameDate: '08.25(화)',
      homeTeam: '샌프란시스코 자이언츠', awayTeam: '신시내티 레즈', homeStarter: '위즌헌트', awayStarter: '번스',
      homeEra: 3.50, awayEra: 3.80, homeWhip: 1.15, awayWhip: 1.22, homeOps: 0.735, awayOps: 0.725,
      homeWrcPlus: 105, awayWrcPlus: 102, aiPrediction: '승', stadium: '오라클 파크',
    ),

    // --- NPB 6경기 (No.6265 ~ No.6290) : 각 경기별 개별 세이버메트릭스 수치 지정 ---
    const MatchModel(
      id: '6265', betmanProtoNo: '6265', displayNo: '#No.6265', league: 'NPB', gameTime: '18:00', gameDate: '08.25(화)',
      homeTeam: '지바롯데', awayTeam: '소프트뱅', homeStarter: '요시카와', awayStarter: '모이넬로',
      homeEra: 3.20, awayEra: 2.95, homeWhip: 1.08, awayWhip: 0.98, homeOps: 0.740, awayOps: 0.780,
      homeWrcPlus: 106, awayWrcPlus: 118, aiPrediction: '승', stadium: 'ZOZO 마린 스타디움',
    ),
    const MatchModel(
      id: '6270', betmanProtoNo: '6270', displayNo: '#No.6270', league: 'NPB', gameTime: '18:00', gameDate: '08.25(화)',
      homeTeam: '야쿠르트', awayTeam: '요미우리', homeStarter: '요시무라', awayStarter: '노리모토',
      homeEra: 3.42, awayEra: 3.75, homeWhip: 1.12, awayWhip: 1.22, homeOps: 0.770, awayOps: 0.735,
      homeWrcPlus: 112, awayWrcPlus: 105, aiPrediction: '승', stadium: '메이지 진구 구장',
    ),
    const MatchModel(
      id: '6275', betmanProtoNo: '6275', displayNo: '#No.6275', league: 'NPB', gameTime: '18:00', gameDate: '08.25(화)',
      homeTeam: '주니치', awayTeam: '한신', homeStarter: '오노', awayStarter: '니시',
      homeEra: 3.10, awayEra: 3.40, homeWhip: 1.05, awayWhip: 1.14, homeOps: 0.700, awayOps: 0.745,
      homeWrcPlus: 98, awayWrcPlus: 108, aiPrediction: '승', stadium: '반테린 돔 나고야',
    ),
    const MatchModel(
      id: '6280', betmanProtoNo: '6280', displayNo: '#No.6280', league: 'NPB', gameTime: '18:00', gameDate: '08.25(화)',
      homeTeam: '세이부', awayTeam: '닛폰햄', homeStarter: '타이라', awayStarter: '이토',
      homeEra: 3.05, awayEra: 3.35, homeWhip: 1.04, awayWhip: 1.12, homeOps: 0.710, awayOps: 0.750,
      homeWrcPlus: 100, awayWrcPlus: 110, aiPrediction: '승', stadium: '베루나 돔',
    ),
    const MatchModel(
      id: '6285', betmanProtoNo: '6285', displayNo: '#No.6285', league: 'NPB', gameTime: '18:00', gameDate: '08.25(화)',
      homeTeam: '오릭스', awayTeam: '라쿠텐', homeStarter: '미야기', awayStarter: '하야카와',
      homeEra: 2.90, awayEra: 3.45, homeWhip: 0.99, awayWhip: 1.15, homeOps: 0.745, awayOps: 0.730,
      homeWrcPlus: 108, awayWrcPlus: 104, aiPrediction: '승', stadium: '교세라 돔 오사카',
    ),
    const MatchModel(
      id: '6290', betmanProtoNo: '6290', displayNo: '#No.6290', league: 'NPB', gameTime: '18:00', gameDate: '08.25(화)',
      homeTeam: '요코베이', awayTeam: '히로카프', homeStarter: '아즈마', awayStarter: '토코다',
      homeEra: 2.85, awayEra: 3.20, homeWhip: 1.02, awayWhip: 1.10, homeOps: 0.770, awayOps: 0.735,
      homeWrcPlus: 114, awayWrcPlus: 106, aiPrediction: '승', stadium: '요코하마 스타디움',
    ),

    // --- KBO 5경기 (No.6305 ~ No.6325) : 각 경기별 개별 세이버메트릭스 수치 지정 ---
    const MatchModel(
      id: '6305', betmanProtoNo: '6305', displayNo: '#No.6305', league: 'KBO', gameTime: '18:30', gameDate: '08.25(화)',
      homeTeam: 'LG', awayTeam: 'NC', homeStarter: '톨허스트', awayStarter: '테일러',
      homeEra: 3.35, awayEra: 3.65, homeWhip: 1.15, awayWhip: 1.22, homeOps: 0.775, awayOps: 0.740,
      homeWrcPlus: 115, awayWrcPlus: 105, aiPrediction: '승', stadium: '잠실야구장',
    ),
    const MatchModel(
      id: '6310', betmanProtoNo: '6310', displayNo: '#No.6310', league: 'KBO', gameTime: '18:30', gameDate: '08.25(화)',
      homeTeam: 'SSG', awayTeam: '한화', homeStarter: '김광현', awayStarter: '류현진',
      homeEra: 3.85, awayEra: 3.65, homeWhip: 1.25, awayWhip: 1.18, homeOps: 0.750, awayOps: 0.760,
      homeWrcPlus: 108, awayWrcPlus: 110, aiPrediction: '승', stadium: '인천SSG랜더스필드',
    ),
    const MatchModel(
      id: '6315', betmanProtoNo: '6315', displayNo: '#No.6315', league: 'KBO', gameTime: '18:30', gameDate: '08.25(화)',
      homeTeam: '키움', awayTeam: '삼성', homeStarter: '후라도', awayStarter: '원태인',
      homeEra: 3.10, awayEra: 3.45, homeWhip: 1.15, awayWhip: 1.20, homeOps: 0.770, awayOps: 0.765,
      homeWrcPlus: 114, awayWrcPlus: 112, aiPrediction: '승', stadium: '고척스카이돔',
    ),
    const MatchModel(
      id: '6320', betmanProtoNo: '6320', displayNo: '#No.6320', league: 'KBO', gameTime: '18:30', gameDate: '08.25(화)',
      homeTeam: 'KT', awayTeam: '두산', homeStarter: '쿠에바스', awayStarter: '곽빈',
      homeEra: 3.60, awayEra: 3.75, homeWhip: 1.22, awayWhip: 1.28, homeOps: 0.755, awayOps: 0.745,
      homeWrcPlus: 110, awayWrcPlus: 108, aiPrediction: '승', stadium: '수원KT위즈파크',
    ),
    const MatchModel(
      id: '6325', betmanProtoNo: '6325', displayNo: '#No.6325', league: 'KBO', gameTime: '18:30', gameDate: '08.25(화)',
      homeTeam: 'KIA', awayTeam: '롯데', homeStarter: '네일', awayStarter: '반즈',
      homeEra: 2.53, awayEra: 2.95, homeWhip: 1.05, awayWhip: 1.10, homeOps: 0.810, awayOps: 0.785,
      homeWrcPlus: 125, awayWrcPlus: 118, aiPrediction: '승', stadium: '광주-기아 챔피언스필드',
    ),
  ];

  List<MatchModel> get matches => _matches;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  // ⭕ API 응답 순서(Index)를 보존하여 실시간 동기화
  Future<void> fetchActiveMatches() async {
    _isLoading = true;
    notifyListeners();

    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final response = await http.get(
        Uri.parse('http://localhost:8000/api/games/active?_t='),
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        final List<dynamic> gamesJson = data['games'] ?? data['matches'] ?? [];
        if (gamesJson.isNotEmpty) {
          // API에서 전달된 21개 경기 원본 배열 순서 그대로 매핑 저장
          _matches = gamesJson.map((json) => MatchModel.fromJson(json)).toList();
        }
      }
    } catch (e) {
      debugPrint('API 실시간 동기화 오류 (내장 공식 21개 경기 유지): ');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
