import 'package:flutter/material.dart';
import 'lib/models/match_model.dart';

// 불펜 투수 데이터 모델
class BullpenPitcher {
  final String id;
  final String name;
  final String role;
  final double lob;
  final double irs;
  final double whip;
  final double kbb;
  final String fatigue;
  final double recentLob;
  final double recentWhip;
  final String recentPitches;
  final bool isPositive;

  const BullpenPitcher({
    required this.id,
    required this.name,
    required this.role,
    required this.lob,
    required this.irs,
    required this.whip,
    required this.kbb,
    required this.fatigue,
    required this.recentLob,
    required this.recentWhip,
    required this.recentPitches,
    required this.isPositive,
  });
}

// 타자 핵심 데이터 모델
class BatterMetrics {
  final String id;
  final String name;
  final String order;
  final String position;
  final double woba;
  final double ops;
  final double risp;
  final double bbRate;
  final double hardHit;
  final double seasonAvg;
  final double recent5Ops;
  final double recent5Avg;
  final int recent5Hits;
  final int recent5Homers;
  final int recent5Rbi;

  const BatterMetrics({
    required this.id,
    required this.name,
    required this.order,
    required this.position,
    required this.woba,
    required this.ops,
    required this.risp,
    required this.bbRate,
    required this.hardHit,
    required this.seasonAvg,
    required this.recent5Ops,
    required this.recent5Avg,
    required this.recent5Hits,
    required this.recent5Homers,
    required this.recent5Rbi,
  });
}

class MobileMatchDetailScreen extends StatefulWidget {
  final String? betmanProtoNo;
  final String? displayNo;
  final MatchModel? match;

  const MobileMatchDetailScreen({
    Key? key,
    this.betmanProtoNo,
    this.displayNo,
    this.match,
  }) : super(key: key);

  @override
  State<MobileMatchDetailScreen> createState() => _MobileMatchDetailScreenState();
}

class _MobileMatchDetailScreenState extends State<MobileMatchDetailScreen> {
  // 홈 & 원정 불펜 투수 리스트
  final List<BullpenPitcher> homeBullpenList = const [
    BullpenPitcher(id: '1', name: '김재윤', role: '마무리', lob: 82.5, irs: 21.0, whip: 0.95, kbb: 22.8, fatigue: '1.1이닝 (22구)', recentLob: 85.0, recentWhip: 0.80, recentPitches: '22구', isPositive: true),
    BullpenPitcher(id: '2', name: '오승환', role: '셋업', lob: 79.0, irs: 25.0, whip: 1.10, kbb: 18.5, fatigue: '1.0이닝 (15구)', recentLob: 81.0, recentWhip: 1.00, recentPitches: '15구', isPositive: true),
    BullpenPitcher(id: '3', name: '임창민', role: '필승조', lob: 75.0, irs: 28.5, whip: 1.22, kbb: 16.0, fatigue: '2.0이닝 (34구)', recentLob: 73.0, recentWhip: 1.30, recentPitches: '34구', isPositive: false),
    BullpenPitcher(id: '4', name: '이승현', role: '좌완', lob: 74.0, irs: 30.0, whip: 1.28, kbb: 15.2, fatigue: '1.2이닝 (28구)', recentLob: 70.0, recentWhip: 1.35, recentPitches: '28구', isPositive: false),
  ];

  final List<BullpenPitcher> awayBullpenList = const [
    BullpenPitcher(id: '1', name: '정해영', role: '마무리', lob: 68.0, irs: 42.5, whip: 1.48, kbb: 9.5, fatigue: '3.2이닝 (78구)', recentLob: 62.0, recentWhip: 1.65, recentPitches: '78구', isPositive: false),
    BullpenPitcher(id: '2', name: '전상현', role: '셋업', lob: 72.0, irs: 35.0, whip: 1.32, kbb: 14.0, fatigue: '2.1이닝 (45구)', recentLob: 70.0, recentWhip: 1.40, recentPitches: '45구', isPositive: false),
    BullpenPitcher(id: '3', name: '곽도규', role: '좌완필승', lob: 76.5, irs: 29.0, whip: 1.18, kbb: 19.5, fatigue: '1.0이닝 (18구)', recentLob: 80.0, recentWhip: 1.05, recentPitches: '18구', isPositive: true),
    BullpenPitcher(id: '4', name: '최지민', role: '롱릴리프', lob: 69.5, irs: 38.0, whip: 1.40, kbb: 11.0, fatigue: '3.0이닝 (60구)', recentLob: 65.0, recentWhip: 1.55, recentPitches: '60구', isPositive: false),
  ];

  // 홈 & 원정 타자 리스트
  final List<BatterMetrics> homeBatterList = const [
    BatterMetrics(id: 'h1', name: '구자욱', order: '3번', position: '우익수', woba: 0.412, ops: 0.965, risp: 0.358, bbRate: 12.4, hardHit: 44.5, seasonAvg: 0.332, recent5Ops: 1.120, recent5Avg: 0.412, recent5Hits: 7, recent5Homers: 2, recent5Rbi: 6),
    BatterMetrics(id: 'h2', name: '디아즈', order: '4번', position: '1루수', woba: 0.395, ops: 0.910, risp: 0.340, bbRate: 9.8, hardHit: 48.2, seasonAvg: 0.298, recent5Ops: 0.980, recent5Avg: 0.333, recent5Hits: 6, recent5Homers: 3, recent5Rbi: 8),
    BatterMetrics(id: 'h3', name: '박병호', order: '5번', position: '지명', woba: 0.360, ops: 0.845, risp: 0.285, bbRate: 11.2, hardHit: 46.0, seasonAvg: 0.265, recent5Ops: 0.890, recent5Avg: 0.294, recent5Hits: 5, recent5Homers: 2, recent5Rbi: 5),
    BatterMetrics(id: 'h4', name: '김지찬', order: '1번', position: '중견수', woba: 0.375, ops: 0.820, risp: 0.310, bbRate: 13.5, hardHit: 28.0, seasonAvg: 0.315, recent5Ops: 0.860, recent5Avg: 0.350, recent5Hits: 7, recent5Homers: 0, recent5Rbi: 2),
    BatterMetrics(id: 'h5', name: '강민호', order: '6번', position: '포수', woba: 0.355, ops: 0.815, risp: 0.305, bbRate: 8.5, hardHit: 38.5, seasonAvg: 0.280, recent5Ops: 0.780, recent5Avg: 0.250, recent5Hits: 4, recent5Homers: 1, recent5Rbi: 3),
  ];

  final List<BatterMetrics> awayBatterList = const [
    BatterMetrics(id: 'a1', name: '김도영', order: '3번', position: '3루수', woba: 0.445, ops: 1.045, risp: 0.385, bbRate: 13.8, hardHit: 47.5, seasonAvg: 0.345, recent5Ops: 1.250, recent5Avg: 0.450, recent5Hits: 9, recent5Homers: 3, recent5Rbi: 7),
    BatterMetrics(id: 'a2', name: '최형우', order: '4번', position: '지명', woba: 0.405, ops: 0.935, risp: 0.370, bbRate: 14.2, hardHit: 43.0, seasonAvg: 0.305, recent5Ops: 0.920, recent5Avg: 0.294, recent5Hits: 5, recent5Homers: 1, recent5Rbi: 5),
    BatterMetrics(id: 'a3', name: '나성범', order: '5번', position: '우익수', woba: 0.380, ops: 0.880, risp: 0.320, bbRate: 10.5, hardHit: 45.8, seasonAvg: 0.285, recent5Ops: 0.850, recent5Avg: 0.278, recent5Hits: 5, recent5Homers: 2, recent5Rbi: 4),
    BatterMetrics(id: 'a4', name: '박찬호', order: '1번', position: '유격수', woba: 0.335, ops: 0.745, risp: 0.295, bbRate: 9.0, hardHit: 26.5, seasonAvg: 0.290, recent5Ops: 0.720, recent5Avg: 0.263, recent5Hits: 5, recent5Homers: 0, recent5Rbi: 2),
    BatterMetrics(id: 'a5', name: '소크라테스', order: '2번', position: '중견수', woba: 0.365, ops: 0.840, risp: 0.300, bbRate: 8.8, hardHit: 41.2, seasonAvg: 0.288, recent5Ops: 0.810, recent5Avg: 0.278, recent5Hits: 5, recent5Homers: 1, recent5Rbi: 3),
  ];

  late BullpenPitcher selectedHomeBp;
  late BullpenPitcher selectedAwayBp;
  late BatterMetrics selectedHomeBt;
  late BatterMetrics selectedAwayBt;

  @override
  void initState() {
    super.initState();
    selectedHomeBp = homeBullpenList[0];
    selectedAwayBp = awayBullpenList[0];
    selectedHomeBt = homeBatterList[0];
    selectedAwayBt = awayBatterList[0];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1120),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 0,
        title: const Text(
          '⚾ 매치 상세 데이터 분석',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF2563EB),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Center(
              child: Text(
                widget.betmanProtoNo != null
                    ? 'No.${widget.betmanProtoNo} 승1패'
                    : (widget.displayNo != null ? '${widget.displayNo} 승1패' : 'No.미정 승1패'),
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 매치업 요약 카드
            _buildMatchupHeader(),
            const SizedBox(height: 14),

            // ═════════════════════════════════════════════════
            // 🎯 1-1. [선발 투수 파트] 5대 핵심 지표
            // ═════════════════════════════════════════════════
            _buildSectionTitle('🎯 1-1. 선발 투수 5대 핵심 지표 비교', const Color(0xFF60A5FA)),
            const SizedBox(height: 6),
            _buildCard(
              children: [
                _buildCompactRow(label: 'ERA', subLabel: '평균자책', homeVal: '2.10', awayVal: '4.20', homeSeason: '2.85', awaySeason: '3.55', homePositive: true, awayPositive: false),
                _buildCompactRow(label: 'FIP', subLabel: '수비무관', homeVal: '2.65', awayVal: '3.95', homeSeason: '3.10', awaySeason: '3.65', homePositive: true, awayPositive: false),
                _buildCompactRow(label: 'WHIP', subLabel: '출루허용', homeVal: '0.95', awayVal: '1.35', homeSeason: '1.05', awaySeason: '1.18', homePositive: true, awayPositive: false),
                _buildCompactRow(label: 'K/9', subLabel: '탈삼진', homeVal: '9.80', awayVal: '7.50', homeSeason: '8.85', awaySeason: '8.20', homePositive: true, awayPositive: false),
                _buildCompactRow(label: 'BB/9', subLabel: '볼넷억제', homeVal: '1.80', awayVal: '3.10', homeSeason: '2.10', awaySeason: '2.45', homePositive: true, awayPositive: false),
              ],
            ),
            const SizedBox(height: 10),

            // 1-1-1. 🔥 선발 최근 3경기 흐름
            _buildSubSectionTitle('🔥 1-1-1. 선발 최근 3경기 흐름 (시즌 ➔ 최근 3G)', const Color(0xFFFB7185)),
            const SizedBox(height: 6),
            _buildCard(
              children: [
                _buildCompactRow(label: '평균이닝', subLabel: '이닝 소화력', homeVal: '7.1이닝', awayVal: '5.2이닝', homeSeason: '6.7', awaySeason: '6.3', homePositive: true, awayPositive: false),
                _buildCompactRow(label: '최근 ERA', subLabel: '최근 자책점', homeVal: '2.10', awayVal: '4.20', homePositive: true, awayPositive: false),
              ],
            ),
            const SizedBox(height: 16),

            // ═════════════════════════════════════════════════
            // ➦ 명확한 구분선 (DIVIDER)
            // ═════════════════════════════════════════════════
            _buildDivider('🛡️ 불펜 투수 분석 영역'),
            const SizedBox(height: 16),

            // ═════════════════════════════════════════════════
            // 🛡️ 1-2. [불펜 투수 파트] 투수 선택기 & 5대 핵심 지표
            // ═════════════════════════════════════════════════
            _buildSectionTitle('🛡️ 1-2. 불펜 투수 핵심 5대 지표 비교', const Color(0xFF818CF8)),
            const SizedBox(height: 8),

            // 불펜 투수 선택 드롭다운
            _buildBullpenPickerRow(),
            const SizedBox(height: 8),

            // 불펜 5대 핵심 지표 테이블
            _buildCard(
              children: [
                _buildCompactRow(label: 'LOB%', subLabel: '잔루처리율 (높을수록 우수)', homeVal: '${selectedHomeBp.lob.toStringAsFixed(1)}%', awayVal: '${selectedAwayBp.lob.toStringAsFixed(1)}%', homePositive: selectedHomeBp.lob >= 75, awayPositive: selectedAwayBp.lob >= 75),
                _buildCompactRow(label: 'IRS%', subLabel: '승계주자 실점률 (낮을수록 우수)', homeVal: '${selectedHomeBp.irs.toStringAsFixed(1)}%', awayVal: '${selectedAwayBp.irs.toStringAsFixed(1)}%', homePositive: selectedHomeBp.irs <= 30, awayPositive: selectedAwayBp.irs <= 30),
                _buildCompactRow(label: 'WHIP', subLabel: '출루허용 (낮을수록 우수)', homeVal: selectedHomeBp.whip.toStringAsFixed(2), awayVal: selectedAwayBp.whip.toStringAsFixed(2), homePositive: selectedHomeBp.whip <= 1.20, awayPositive: selectedAwayBp.whip <= 1.20),
                _buildCompactRow(label: 'K-BB%', subLabel: '탈삼진 마진 (높을수록 우수)', homeVal: '${selectedHomeBp.kbb.toStringAsFixed(1)}%', awayVal: '${selectedAwayBp.kbb.toStringAsFixed(1)}%', homePositive: selectedHomeBp.kbb >= 15, awayPositive: selectedAwayBp.kbb >= 15),
                _buildCompactRow(label: '피로도', subLabel: '최근 3일 투구/연투', homeVal: selectedHomeBp.fatigue, awayVal: selectedAwayBp.fatigue, homePositive: selectedHomeBp.isPositive, awayPositive: selectedAwayBp.isPositive),
              ],
            ),
            const SizedBox(height: 10),

            // 1-2-1. ⚡ [불펜 최근 3경기 흐름]
            _buildSubSectionTitle('⚡ 1-2-1. 불펜 최근 3경기 흐름 (시즌 vs 최근 3G)', const Color(0xFF22D3EE)),
            const SizedBox(height: 6),
            _buildCard(
              children: [
                _buildCompactRow(
                  label: '최근 LOB%',
                  subLabel: '잔루율 변화',
                  homeVal: '${selectedHomeBp.recentLob.toStringAsFixed(1)}%',
                  awayVal: '${selectedAwayBp.recentLob.toStringAsFixed(1)}%',
                  homeSeason: '${selectedHomeBp.lob.toStringAsFixed(1)}%',
                  awaySeason: '${selectedAwayBp.lob.toStringAsFixed(1)}%',
                  homePositive: selectedHomeBp.recentLob >= selectedHomeBp.lob,
                  awayPositive: selectedAwayBp.recentLob >= selectedAwayBp.lob,
                ),
                _buildCompactRow(
                  label: '최근 WHIP',
                  subLabel: '출루허용 변화',
                  homeVal: selectedHomeBp.recentWhip.toStringAsFixed(2),
                  awayVal: selectedAwayBp.recentWhip.toStringAsFixed(2),
                  homeSeason: selectedHomeBp.whip.toStringAsFixed(2),
                  awaySeason: selectedAwayBp.whip.toStringAsFixed(2),
                  homePositive: selectedHomeBp.recentWhip <= selectedHomeBp.whip,
                  awayPositive: selectedAwayBp.recentWhip <= selectedAwayBp.whip,
                ),
                _buildCompactRow(
                  label: '3일 투구수',
                  subLabel: '연투 부하도',
                  homeVal: selectedHomeBp.recentPitches,
                  awayVal: selectedAwayBp.recentPitches,
                  homePositive: selectedHomeBp.isPositive,
                  awayPositive: selectedAwayBp.isPositive,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ═════════════════════════════════════════════════
            // ➦ 명확한 구분선 (DIVIDER) - 타자 영역
            // ═════════════════════════════════════════════════
            _buildDivider('⚔️ 타자 타선 분석 영역', badgeColor: const Color(0xFF451A03), borderColor: const Color(0xFFD97706), textColor: const Color(0xFFFCD34D)),
            const SizedBox(height: 16),

            // ═════════════════════════════════════════════════
            // ⚔️ 2. [타자 파트] 타자 선택기 & 5대 핵심 지표
            // ═════════════════════════════════════════════════
            _buildSectionTitle('⚔️ 2. 타자 핵심 5대 수치 비교', const Color(0xFFF59E0B)),
            const SizedBox(height: 8),

            // 타자 선택 드롭다운 (중심 타선 및 주요 타자)
            _buildBatterPickerRow(),
            const SizedBox(height: 8),

            // 타자 5대 핵심 지표 테이블
            _buildCard(
              children: [
                _buildCompactRow(
                  label: 'wOBA',
                  subLabel: '가중 출루율',
                  homeVal: selectedHomeBt.woba.toStringAsFixed(3),
                  awayVal: selectedAwayBt.woba.toStringAsFixed(3),
                  homePositive: selectedHomeBt.woba >= selectedAwayBt.woba,
                  awayPositive: selectedAwayBt.woba > selectedHomeBt.woba,
                ),
                _buildCompactRow(
                  label: 'OPS',
                  subLabel: '출루율+장타율',
                  homeVal: selectedHomeBt.ops.toStringAsFixed(3),
                  awayVal: selectedAwayBt.ops.toStringAsFixed(3),
                  homePositive: selectedHomeBt.ops >= selectedAwayBt.ops,
                  awayPositive: selectedAwayBt.ops > selectedHomeBt.ops,
                ),
                _buildCompactRow(
                  label: 'RISP',
                  subLabel: '득점권 타율',
                  homeVal: selectedHomeBt.risp.toStringAsFixed(3),
                  awayVal: selectedAwayBt.risp.toStringAsFixed(3),
                  homePositive: selectedHomeBt.risp >= selectedAwayBt.risp,
                  awayPositive: selectedAwayBt.risp > selectedHomeBt.risp,
                ),
                _buildCompactRow(
                  label: 'BB%',
                  subLabel: '볼넷 비율',
                  homeVal: '${selectedHomeBt.bbRate.toStringAsFixed(1)}%',
                  awayVal: '${selectedAwayBt.bbRate.toStringAsFixed(1)}%',
                  homePositive: selectedHomeBt.bbRate >= selectedAwayBt.bbRate,
                  awayPositive: selectedAwayBt.bbRate > selectedHomeBt.bbRate,
                ),
                _buildCompactRow(
                  label: 'HardHit%',
                  subLabel: '강한타구비율',
                  homeVal: '${selectedHomeBt.hardHit.toStringAsFixed(1)}%',
                  awayVal: '${selectedAwayBt.hardHit.toStringAsFixed(1)}%',
                  homePositive: selectedHomeBt.hardHit >= selectedAwayBt.hardHit,
                  awayPositive: selectedAwayBt.hardHit > selectedHomeBt.hardHit,
                ),
              ],
            ),
            const SizedBox(height: 10),

            // 2-1. 🚀 [타자 최근 5경기 흐름] (시즌 vs 최근 5G)
            _buildSubSectionTitle('🚀 2-1. 타자 최근 5경기 흐름 (시즌 vs 최근 5G)', const Color(0xFFFBBF24)),
            const SizedBox(height: 6),
            _buildCard(
              children: [
                _buildCompactRow(
                  label: '최근 OPS',
                  subLabel: '5G 생산력 변화',
                  homeVal: selectedHomeBt.recent5Ops.toStringAsFixed(3),
                  awayVal: selectedAwayBt.recent5Ops.toStringAsFixed(3),
                  homeSeason: selectedHomeBt.ops.toStringAsFixed(3),
                  awaySeason: selectedAwayBt.ops.toStringAsFixed(3),
                  homePositive: selectedHomeBt.recent5Ops >= selectedHomeBt.ops,
                  awayPositive: selectedAwayBt.recent5Ops >= selectedAwayBt.ops,
                ),
                _buildCompactRow(
                  label: '최근 타율',
                  subLabel: '5G 타율 변화',
                  homeVal: selectedHomeBt.recent5Avg.toStringAsFixed(3),
                  awayVal: selectedAwayBt.recent5Avg.toStringAsFixed(3),
                  homeSeason: selectedHomeBt.seasonAvg.toStringAsFixed(3),
                  awaySeason: selectedAwayBt.seasonAvg.toStringAsFixed(3),
                  homePositive: selectedHomeBt.recent5Avg >= selectedHomeBt.seasonAvg,
                  awayPositive: selectedAwayBt.recent5Avg >= selectedAwayBt.seasonAvg,
                ),
                _buildCompactRow(
                  label: '5G 타격',
                  subLabel: '안타 (홈런)',
                  homeVal: '${selectedHomeBt.recent5Hits}안타 (${selectedHomeBt.recent5Homers}HR)',
                  awayVal: '${selectedAwayBt.recent5Hits}안타 (${selectedAwayBt.recent5Homers}HR)',
                  homePositive: selectedHomeBt.recent5Homers > 0,
                  awayPositive: selectedAwayBt.recent5Homers > 0,
                ),
                _buildCompactRow(
                  label: '5G 타점',
                  subLabel: '클러치 해결',
                  homeVal: '${selectedHomeBt.recent5Rbi}타점',
                  awayVal: '${selectedAwayBt.recent5Rbi}타점',
                  homePositive: selectedHomeBt.recent5Rbi >= selectedAwayBt.recent5Rbi,
                  awayPositive: selectedAwayBt.recent5Rbi > selectedHomeBt.recent5Rbi,
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  // 1. 매치업 헤더 박스
  Widget _buildMatchupHeader() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text('HOME', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF60A5FA))),
              SizedBox(height: 2),
              Text('삼성 라이온즈', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
              Text('선발: 원태인', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
            ],
          ),
          const Text('VS', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF64748B))),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: const [
              Text('AWAY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFFB923C))),
              SizedBox(height: 2),
              Text('KIA 타이거즈', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
              Text('선발: 양현종', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
            ],
          ),
        ],
      ),
    );
  }

  // 2. 불펜 투수 선택 드롭다운 뷰
  Widget _buildBullpenPickerRow() {
    return Row(
      children: [
        // 홈 불펜 드롭다운
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF1E3A8A)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('🏠 홈 불펜 투수', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF60A5FA))),
                DropdownButton<BullpenPitcher>(
                  value: selectedHomeBp,
                  isExpanded: true,
                  dropdownColor: const Color(0xFF0F172A),
                  underline: const SizedBox(),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  items: homeBullpenList.map((bp) {
                    return DropdownMenuItem(value: bp, child: Text('${bp.name} (${bp.role})'));
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => selectedHomeBp = val);
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),

        // 원정 불펜 드롭다운
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF7C2D12)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('✈️ 원정 불펜 투수', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFFB923C))),
                DropdownButton<BullpenPitcher>(
                  value: selectedAwayBp,
                  isExpanded: true,
                  dropdownColor: const Color(0xFF0F172A),
                  underline: const SizedBox(),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  items: awayBullpenList.map((bp) {
                    return DropdownMenuItem(value: bp, child: Text('${bp.name} (${bp.role})'));
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => selectedAwayBp = val);
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // 2-2. 타자 선택 드롭다운 뷰 (중심 타선 & 주요 타자)
  Widget _buildBatterPickerRow() {
    return Row(
      children: [
        // 홈 타자 드롭다운
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF1E40AF)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('🏠 홈 주요 타자 (삼성)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8))),
                DropdownButton<BatterMetrics>(
                  value: selectedHomeBt,
                  isExpanded: true,
                  dropdownColor: const Color(0xFF0F172A),
                  underline: const SizedBox(),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  items: homeBatterList.map((bt) {
                    return DropdownMenuItem(value: bt, child: Text('${bt.order} ${bt.name} (${bt.position})'));
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => selectedHomeBt = val);
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),

        // 원정 타자 드롭다운
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF9A3412)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('✈️ 원정 주요 타자 (KIA)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFFB923C))),
                DropdownButton<BatterMetrics>(
                  value: selectedAwayBt,
                  isExpanded: true,
                  dropdownColor: const Color(0xFF0F172A),
                  underline: const SizedBox(),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                  items: awayBatterList.map((bt) {
                    return DropdownMenuItem(value: bt, child: Text('${bt.order} ${bt.name} (${bt.position})'));
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => selectedAwayBt = val);
                  },
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // 3. 3열 컴팩트 행 위젯
  Widget _buildCompactRow({
    required String label,
    String? subLabel,
    required String homeVal,
    required String awayVal,
    String? homeSeason,
    String? awaySeason,
    required bool homePositive,
    required bool awayPositive,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0x20334155))),
      ),
      child: Row(
        children: [
          // 홈팀 값
          Expanded(
            flex: 4,
            child: Row(
              children: [
                Text(homeVal, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(width: 4),
                _buildBadge(homePositive ? '▲' : '▼', homePositive),
                if (homeSeason != null) ...[
                  const SizedBox(width: 4),
                  Text('($homeSeason)', style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                ]
              ],
            ),
          ),

          // 중앙 지표명
          Expanded(
            flex: 4,
            child: Column(
              children: [
                Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFFE2E8F0))),
                if (subLabel != null)
                  Text(subLabel, style: const TextStyle(fontSize: 9, color: Color(0xFF64748B))),
              ],
            ),
          ),

          // 원정팀 값
          Expanded(
            flex: 4,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (awaySeason != null) ...[
                  Text('($awaySeason)', style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                  const SizedBox(width: 4),
                ],
                _buildBadge(awayPositive ? '▲' : '▼', awayPositive),
                const SizedBox(width: 4),
                Text(awayVal, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 4. 배지 위젯 (#E53E3E 테마 적용)
  Widget _buildBadge(String symbol, bool isPositive) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
      decoration: BoxDecoration(
        color: isPositive ? const Color(0xFF450A0A) : const Color(0xFF082F49),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: isPositive ? const Color(0xFFE53E3E) : const Color(0xFF0284C7), width: 0.5),
      ),
      child: Text(
        symbol,
        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: isPositive ? const Color(0xFFE53E3E) : const Color(0xFF38BDF8)),
      ),
    );
  }

  // 5. 섹션 헤더 & 구분선
  Widget _buildSectionTitle(String title, Color color) {
    return Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: color));
  }

  Widget _buildSubSectionTitle(String title, Color color) {
    return Text(title, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color));
  }

  Widget _buildDivider(String label, {Color badgeColor = const Color(0xFF1E1B4B), Color borderColor = const Color(0xFF6366F1), Color textColor = const Color(0xFFA5B4FC)}) {
    return Row(
      children: [
        const Expanded(child: Divider(color: Color(0xFF334155))),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: badgeColor,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor),
          ),
          child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColor)),
        ),
        const Expanded(child: Divider(color: Color(0xFF334155))),
      ],
    );
  }

  Widget _buildCard({required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(children: children),
    );
  }
}
