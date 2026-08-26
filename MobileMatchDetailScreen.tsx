import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// 지표 타입 정의
interface MetricRowProps {
  label: string;
  subLabel?: string;
  homeVal: string | number;
  awayVal: string | number;
  homeSeason?: string | number;
  awaySeason?: string | number;
  homeBadge?: { symbol: '▲' | '▼'; isPositive: boolean };
  awayBadge?: { symbol: '▲' | '▼'; isPositive: boolean };
  unit?: string;
}

// 대시보드 공통 헤더 컴포넌트 (회차 표시 제거 후 실시간 데이터 자동 연동 상태 표기)
export const DashboardHeader: React.FC = () => {
  return (
    <View style={styles.dashboardHeaderContainer}>
      <View style={styles.dashboardHeaderTopRow}>
        <Text style={styles.dashboardHeaderTitle}>야구 승1패 AI 대시보드</Text>
        {/* ⭕ 수정: 회차 표시 제거 후 실시간 업로드 상태만 표기 */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusBadgeText}>🔴 BETMAN 실시간 경기 자동 연동</Text>
        </View>
      </View>
      <Text style={styles.dashboardSubtitle}>
        BETMAN 공식 프로토 연동 · 실시간 세이버메트릭스
      </Text>
    </View>
  );
};

// 3열 가로형 컴팩트 지표 행 컴포넌트 [ 홈 투수 값 | 지표명 (약어) | 원정 투수 값 ]
const CompactMetricRow: React.FC<MetricRowProps> = ({
  label,
  subLabel,
  homeVal,
  awayVal,
  homeSeason,
  awaySeason,
  homeBadge,
  awayBadge,
  unit = '',
}) => {
  return (
    <View style={styles.metricRow}>
      {/* 홈팀 값 */}
      <View style={styles.sideValueContainer}>
        <Text style={styles.valueText}>
          {homeVal}
          {unit}
        </Text>
        {homeBadge && (
          <View
            style={[
              styles.badge,
              homeBadge.isPositive ? styles.badgeRed : styles.badgeBlue,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                homeBadge.isPositive ? styles.badgeTextRed : styles.badgeTextBlue,
              ]}
            >
              {homeBadge.symbol}
            </Text>
          </View>
        )}
        {homeSeason !== undefined && (
          <Text style={styles.seasonText}>({homeSeason})</Text>
        )}
      </View>

      {/* 중앙 지표명 */}
      <View style={styles.centerLabelContainer}>
        <Text style={styles.labelText}>{label}</Text>
        {subLabel && <Text style={styles.subLabelText}>{subLabel}</Text>}
      </View>

      {/* 원정팀 값 */}
      <View style={[styles.sideValueContainer, { justifyContent: 'flex-end' }]}>
        {awaySeason !== undefined && (
          <Text style={styles.seasonText}>({awaySeason})</Text>
        )}
        {awayBadge && (
          <View
            style={[
              styles.badge,
              awayBadge.isPositive ? styles.badgeRed : styles.badgeBlue,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                awayBadge.isPositive ? styles.badgeTextRed : styles.badgeTextBlue,
              ]}
            >
              {awayBadge.symbol}
            </Text>
          </View>
        )}
        <Text style={styles.valueText}>
          {awayVal}
          {unit}
        </Text>
      </View>
    </View>
  );
};

// 불펜 투수 데이터 인터페이스
interface BullpenPitcher {
  id: string;
  name: string;
  role: string;
  lob: number;
  irs: number;
  whip: number;
  kbb: number;
  fatigue: string;
  recentLob: number;
  recentWhip: number;
  recentPitches: string;
  isPositive: boolean;
}

// 타자 핵심 데이터 인터페이스
interface BatterMetrics {
  id: string;
  name: string;
  order: string;       // '3번' | '4번' | '5번' | '1번' 등
  position: string;    // '우익수', '1루수' 등
  woba: number;        // wOBA (가중 출루율)
  ops: number;         // OPS
  risp: number;        // RISP (득점권 타율)
  bbRate: number;      // BB% (볼넷율 %)
  hardHit: number;     // HardHit% (강한 타구 비율 %)
  seasonAvg: number;   // 시즌 타율
  recent5Games: {
    ops: number;       // 최근 5경기 OPS
    avg: number;       // 최근 5경기 타율
    hits: number;      // 최근 5경기 안타
    homers: number;    // 최근 5경기 홈런
    rbi: number;       // 최근 5경기 타점
  };
}

const HOME_BULLPEN_LIST: BullpenPitcher[] = [
  { id: '1', name: '김재윤', role: '마무리', lob: 82.5, irs: 21.0, whip: 0.95, kbb: 22.8, fatigue: '1.1이닝 (22구)', recentLob: 85.0, recentWhip: 0.80, recentPitches: '22구', isPositive: true },
  { id: '2', name: '오승환', role: '셋업', lob: 79.0, irs: 25.0, whip: 1.10, kbb: 18.5, fatigue: '1.0이닝 (15구)', recentLob: 81.0, recentWhip: 1.00, recentPitches: '15구', isPositive: true },
  { id: '3', name: '임창민', role: '필승조', lob: 75.0, irs: 28.5, whip: 1.22, kbb: 16.0, fatigue: '2.0이닝 (34구)', recentLob: 73.0, recentWhip: 1.30, recentPitches: '34구', isPositive: false },
  { id: '4', name: '이승현', role: '좌완', lob: 74.0, irs: 30.0, whip: 1.28, kbb: 15.2, fatigue: '1.2이닝 (28구)', recentLob: 70.0, recentWhip: 1.35, recentPitches: '28구', isPositive: false },
];

const AWAY_BULLPEN_LIST: BullpenPitcher[] = [
  { id: '1', name: '정해영', role: '마무리', lob: 68.0, irs: 42.5, whip: 1.48, kbb: 9.5, fatigue: '3.2이닝 (78구)', recentLob: 62.0, recentWhip: 1.65, recentPitches: '78구', isPositive: false },
  { id: '2', name: '전상현', role: '셋업', lob: 72.0, irs: 35.0, whip: 1.32, kbb: 14.0, fatigue: '2.1이닝 (45구)', recentLob: 70.0, recentWhip: 1.40, recentPitches: '45구', isPositive: false },
  { id: '3', name: '곽도규', role: '좌완필승', lob: 76.5, irs: 29.0, whip: 1.18, kbb: 19.5, fatigue: '1.0이닝 (18구)', recentLob: 80.0, recentWhip: 1.05, recentPitches: '18구', isPositive: true },
  { id: '4', name: '최지민', role: '롱릴리프', lob: 69.5, irs: 38.0, whip: 1.40, kbb: 11.0, fatigue: '3.0이닝 (60구)', recentLob: 65.0, recentWhip: 1.55, recentPitches: '60구', isPositive: false },
];

// 홈팀 주요 타자 리스트 (삼성)
const HOME_BATTER_LIST: BatterMetrics[] = [
  {
    id: 'h1',
    name: '구자욱',
    order: '3번',
    position: '우익수',
    woba: 0.412,
    ops: 0.965,
    risp: 0.358,
    bbRate: 12.4,
    hardHit: 44.5,
    seasonAvg: 0.332,
    recent5Games: { ops: 1.120, avg: 0.412, hits: 7, homers: 2, rbi: 6 },
  },
  {
    id: 'h2',
    name: '디아즈',
    order: '4번',
    position: '1루수',
    woba: 0.395,
    ops: 0.910,
    risp: 0.340,
    bbRate: 9.8,
    hardHit: 48.2,
    seasonAvg: 0.298,
    recent5Games: { ops: 0.980, avg: 0.333, hits: 6, homers: 3, rbi: 8 },
  },
  {
    id: 'h3',
    name: '박병호',
    order: '5번',
    position: '지명',
    woba: 0.360,
    ops: 0.845,
    risp: 0.285,
    bbRate: 11.2,
    hardHit: 46.0,
    seasonAvg: 0.265,
    recent5Games: { ops: 0.890, avg: 0.294, hits: 5, homers: 2, rbi: 5 },
  },
  {
    id: 'h4',
    name: '김지찬',
    order: '1번',
    position: '중견수',
    woba: 0.375,
    ops: 0.820,
    risp: 0.310,
    bbRate: 13.5,
    hardHit: 28.0,
    seasonAvg: 0.315,
    recent5Games: { ops: 0.860, avg: 0.350, hits: 7, homers: 0, rbi: 2 },
  },
  {
    id: 'h5',
    name: '강민호',
    order: '6번',
    position: '포수',
    woba: 0.355,
    ops: 0.815,
    risp: 0.305,
    bbRate: 8.5,
    hardHit: 38.5,
    seasonAvg: 0.280,
    recent5Games: { ops: 0.780, avg: 0.250, hits: 4, homers: 1, rbi: 3 },
  },
];

// 원정팀 주요 타자 리스트 (KIA)
const AWAY_BATTER_LIST: BatterMetrics[] = [
  {
    id: 'a1',
    name: '김도영',
    order: '3번',
    position: '3루수',
    woba: 0.445,
    ops: 1.045,
    risp: 0.385,
    bbRate: 13.8,
    hardHit: 47.5,
    seasonAvg: 0.345,
    recent5Games: { ops: 1.250, avg: 0.450, hits: 9, homers: 3, rbi: 7 },
  },
  {
    id: 'a2',
    name: '최형우',
    order: '4번',
    position: '지명',
    woba: 0.405,
    ops: 0.935,
    risp: 0.370,
    bbRate: 14.2,
    hardHit: 43.0,
    seasonAvg: 0.305,
    recent5Games: { ops: 0.920, avg: 0.294, hits: 5, homers: 1, rbi: 5 },
  },
  {
    id: 'a3',
    name: '나성범',
    order: '5번',
    position: '우익수',
    woba: 0.380,
    ops: 0.880,
    risp: 0.320,
    bbRate: 10.5,
    hardHit: 45.8,
    seasonAvg: 0.285,
    recent5Games: { ops: 0.850, avg: 0.278, hits: 5, homers: 2, rbi: 4 },
  },
  {
    id: 'a4',
    name: '박찬호',
    order: '1번',
    position: '유격수',
    woba: 0.335,
    ops: 0.745,
    risp: 0.295,
    bbRate: 9.0,
    hardHit: 26.5,
    seasonAvg: 0.290,
    recent5Games: { ops: 0.720, avg: 0.263, hits: 5, homers: 0, rbi: 2 },
  },
  {
    id: 'a5',
    name: '소크라테스',
    order: '2번',
    position: '중견수',
    woba: 0.365,
    ops: 0.840,
    risp: 0.300,
    bbRate: 8.8,
    hardHit: 41.2,
    seasonAvg: 0.288,
    recent5Games: { ops: 0.810, avg: 0.278, hits: 5, homers: 1, rbi: 3 },
  },
];

export interface MobileMatchGameProp {
  betman_proto_no?: string;
  display_no?: string;
  game_no?: string;
  matchSeq?: number;
  homeTeam?: string;
  awayTeam?: string;
  is_seung_1_pae?: boolean;
}

export const MobileMatchDetailScreen: React.FC<{ game?: MobileMatchGameProp }> = ({ game }) => {
  // 프론트엔드 Props 검증 콘솔 로그
  console.log("[MobileMatchDetailScreen Props]", {
    betman_proto_no: game?.betman_proto_no || "미정",
    display_no: game?.display_no || "No.미정",
    matchSeq: game?.matchSeq
  });

  const protoNo = game?.betman_proto_no || (game?.display_no ? game.display_no.replace('No.', '') : null);
  const headerBadgeText = protoNo ? `No.${protoNo} 승1패` : (game?.display_no ? `${game.display_no} 승1패` : 'No.미정 승1패');

  // 선발 투수 데이터
  const homeStarter = {
    name: '원태인',
    team: '삼성',
    seasonEra: 2.85,
    recent3Era: 2.10,
    seasonFip: 3.10,
    recent3Fip: 2.65,
    seasonWhip: 1.05,
    recent3Whip: 0.95,
    seasonK9: 8.85,
    recent3K9: 9.80,
    seasonBb9: 2.10,
    recent3Bb9: 1.80,
    seasonInn: 6.7,
    recent3Inn: 7.1,
  };

  const awayStarter = {
    name: '양현종',
    team: 'KIA',
    seasonEra: 3.55,
    recent3Era: 4.20,
    seasonFip: 3.65,
    recent3Fip: 3.95,
    seasonWhip: 1.18,
    recent3Whip: 1.35,
    seasonK9: 8.20,
    recent3K9: 7.50,
    seasonBb9: 2.45,
    recent3Bb9: 3.10,
    seasonInn: 6.3,
    recent3Inn: 5.2,
  };

  // 불펜 선택 상태
  const [selectedHomeBpIdx, setSelectedHomeBpIdx] = useState<number>(0);
  const [selectedAwayBpIdx, setSelectedAwayBpIdx] = useState<number>(0);

  const currentHomeBp = HOME_BULLPEN_LIST[selectedHomeBpIdx];
  const currentAwayBp = AWAY_BULLPEN_LIST[selectedAwayBpIdx];

  // 타자 선택 상태 (중심 타선 및 주요 타자)
  const [selectedHomeBtIdx, setSelectedHomeBtIdx] = useState<number>(0);
  const [selectedAwayBtIdx, setSelectedAwayBtIdx] = useState<number>(0);

  const currentHomeBt = HOME_BATTER_LIST[selectedHomeBtIdx];
  const currentAwayBt = AWAY_BATTER_LIST[selectedAwayBtIdx];

  // 타자 지표 비교 (더 높은 쪽에 #E53E3E 빨강 ▲ 배지 부여)
  const getBatterBadges = (valHome: number, valAway: number) => {
    if (valHome === valAway) return { homeBadge: undefined, awayBadge: undefined };
    if (valHome > valAway) {
      return {
        homeBadge: { symbol: '▲' as const, isPositive: true },
        awayBadge: { symbol: '▼' as const, isPositive: false },
      };
    } else {
      return {
        homeBadge: { symbol: '▼' as const, isPositive: false },
        awayBadge: { symbol: '▲' as const, isPositive: true },
      };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* 헤더 바 (동적 벳맨 번호 바인딩) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚾ 매치 상세 데이터 분석</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.matchBadge}>{headerBadgeText}</Text>
        </View>
      </View>

      {/* 전체 ScrollView 컨테이너 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 매치업 요약 카드 */}
        <View style={styles.matchupCard}>
          <View style={styles.teamBox}>
            <Text style={styles.teamHomeTag}>HOME</Text>
            <Text style={styles.teamName}>{homeStarter.team}</Text>
            <Text style={styles.pitcherName}>선발: {homeStarter.name}</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={[styles.teamBox, { alignItems: 'flex-end' }]}>
            <Text style={styles.teamAwayTag}>AWAY</Text>
            <Text style={styles.teamName}>{awayStarter.team}</Text>
            <Text style={styles.pitcherName}>선발: {awayStarter.name}</Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════ */}
        {/* 1-1. 🎯 [선발 투수 파트] 5대 핵심 지표 */}
        {/* ═══════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            🎯 1-1. 선발 투수 5대 핵심 지표 비교
          </Text>
        </View>

        <View style={styles.card}>
          <CompactMetricRow
            label="ERA"
            subLabel="평균자책"
            homeVal={homeStarter.recent3Era.toFixed(2)}
            awayVal={awayStarter.recent3Era.toFixed(2)}
            homeSeason={homeStarter.seasonEra.toFixed(2)}
            awaySeason={awayStarter.seasonEra.toFixed(2)}
            homeBadge={{ symbol: '▲', isPositive: true }}
            awayBadge={{ symbol: '▼', isPositive: false }}
          />
          <CompactMetricRow
            label="FIP"
            subLabel="수비무관"
            homeVal={homeStarter.recent3Fip.toFixed(2)}
            awayVal={awayStarter.recent3Fip.toFixed(2)}
            homeSeason={homeStarter.seasonFip.toFixed(2)}
            awaySeason={awayStarter.seasonFip.toFixed(2)}
            homeBadge={{ symbol: '▲', isPositive: true }}
            awayBadge={{ symbol: '▼', isPositive: false }}
          />
          <CompactMetricRow
            label="WHIP"
            subLabel="출루허용"
            homeVal={homeStarter.recent3Whip.toFixed(2)}
            awayVal={awayStarter.recent3Whip.toFixed(2)}
            homeSeason={homeStarter.seasonWhip.toFixed(2)}
            awaySeason={awayStarter.seasonWhip.toFixed(2)}
            homeBadge={{ symbol: '▲', isPositive: true }}
            awayBadge={{ symbol: '▼', isPositive: false }}
          />
          <CompactMetricRow
            label="K/9"
            subLabel="탈삼진"
            homeVal={homeStarter.recent3K9.toFixed(2)}
            awayVal={awayStarter.recent3K9.toFixed(2)}
            homeSeason={homeStarter.seasonK9.toFixed(2)}
            awaySeason={awayStarter.seasonK9.toFixed(2)}
            homeBadge={{ symbol: '▲', isPositive: true }}
            awayBadge={{ symbol: '▼', isPositive: false }}
          />
          <CompactMetricRow
            label="BB/9"
            subLabel="볼넷억제"
            homeVal={homeStarter.recent3Bb9.toFixed(2)}
            awayVal={awayStarter.recent3Bb9.toFixed(2)}
            homeSeason={homeStarter.seasonBb9.toFixed(2)}
            awaySeason={awayStarter.seasonBb9.toFixed(2)}
            homeBadge={{ symbol: '▲', isPositive: true }}
            awayBadge={{ symbol: '▼', isPositive: false }}
          />
        </View>

        {/* 1-1-1. 🔥 선발 최근 3경기 흐름 (시즌 vs 최근 3G) */}
        <View style={styles.subSectionHeader}>
          <Text style={styles.subSectionTitle}>
            🔥 1-1-1. 선발 최근 3경기 흐름 (시즌 ➔ 최근 3G)
          </Text>
        </View>
        <View style={styles.card}>
          <CompactMetricRow
            label="평균이닝"
            subLabel="이닝 소화력"
            homeVal={`${homeStarter.recent3Inn}이닝`}
            awayVal={`${awayStarter.recent3Inn}이닝`}
            homeSeason={`${homeStarter.seasonInn}`}
            awaySeason={`${awayStarter.seasonInn}`}
            homeBadge={{ symbol: '▲', isPositive: true }}
            awayBadge={{ symbol: '▼', isPositive: false }}
          />
          <CompactMetricRow
            label="최근 ERA"
            subLabel="최근 자책점"
            homeVal={homeStarter.recent3Era.toFixed(2)}
            awayVal={awayStarter.recent3Era.toFixed(2)}
            homeBadge={{ symbol: '▲', isPositive: true }}
            awayBadge={{ symbol: '▼', isPositive: false }}
          />
        </View>

        {/* ═══════════════════════════════════════════════ */}
        {/* ➦ 명확한 섹션 구분선 (DIVIDER) */}
        {/* ═══════════════════════════════════════════════ */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerBadge}>🛡️ 불펜 투수 분석 영역</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ═══════════════════════════════════════════════ */}
        {/* 1-2. 🛡️ [불펜 투수 파트] 투수 선택기 & 5대 핵심 지표 */}
        {/* ═══════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: '#818CF8' }]}>
            🛡️ 1-2. 불펜 투수 핵심 5대 지표 비교
          </Text>
        </View>

        {/* 불펜 투수 선택기 (Home / Away) */}
        <View style={styles.pickerRow}>
          {/* 홈 불펜 Picker */}
          <View style={styles.pickerBox}>
            <Text style={styles.pickerLabel}>🏠 홈 불펜 투수 선택</Text>
            <View style={styles.chipRow}>
              {HOME_BULLPEN_LIST.map((bp, idx) => (
                <TouchableOpacity
                  key={bp.id}
                  style={[
                    styles.chip,
                    selectedHomeBpIdx === idx && styles.chipActiveHome,
                  ]}
                  onPress={() => setSelectedHomeBpIdx(idx)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedHomeBpIdx === idx && styles.chipTextActive,
                    ]}
                  >
                    {bp.name} ({bp.role})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 원정 불펜 Picker */}
          <View style={styles.pickerBox}>
            <Text style={styles.pickerLabel}>✈️ 원정 불펜 투수 선택</Text>
            <View style={styles.chipRow}>
              {AWAY_BULLPEN_LIST.map((bp, idx) => (
                <TouchableOpacity
                  key={bp.id}
                  style={[
                    styles.chip,
                    selectedAwayBpIdx === idx && styles.chipActiveAway,
                  ]}
                  onPress={() => setSelectedAwayBpIdx(idx)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedAwayBpIdx === idx && styles.chipTextActive,
                    ]}
                  >
                    {bp.name} ({bp.role})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 불펜 5대 핵심 지표 테이블 */}
        <View style={styles.card}>
          <CompactMetricRow
            label="LOB%"
            subLabel="잔루처리율 (높을수록 우수)"
            homeVal={`${currentHomeBp.lob.toFixed(1)}%`}
            awayVal={`${currentAwayBp.lob.toFixed(1)}%`}
            homeBadge={{ symbol: currentHomeBp.lob >= 75 ? '▲' : '▼', isPositive: currentHomeBp.lob >= 75 }}
            awayBadge={{ symbol: currentAwayBp.lob >= 75 ? '▲' : '▼', isPositive: currentAwayBp.lob >= 75 }}
          />
          <CompactMetricRow
            label="IRS%"
            subLabel="승계주자 실점률 (낮을수록 우수)"
            homeVal={`${currentHomeBp.irs.toFixed(1)}%`}
            awayVal={`${currentAwayBp.irs.toFixed(1)}%`}
            homeBadge={{ symbol: currentHomeBp.irs <= 30 ? '▲' : '▼', isPositive: currentHomeBp.irs <= 30 }}
            awayBadge={{ symbol: currentAwayBp.irs <= 30 ? '▲' : '▼', isPositive: currentAwayBp.irs <= 30 }}
          />
          <CompactMetricRow
            label="WHIP"
            subLabel="이닝당 출루허용 (낮을수록 우수)"
            homeVal={currentHomeBp.whip.toFixed(2)}
            awayVal={currentAwayBp.whip.toFixed(2)}
            homeBadge={{ symbol: currentHomeBp.whip <= 1.20 ? '▲' : '▼', isPositive: currentHomeBp.whip <= 1.20 }}
            awayBadge={{ symbol: currentAwayBp.whip <= 1.20 ? '▲' : '▼', isPositive: currentAwayBp.whip <= 1.20 }}
          />
          <CompactMetricRow
            label="K-BB%"
            subLabel="탈삼진-볼넷 마진 (높을수록 우수)"
            homeVal={`${currentHomeBp.kbb.toFixed(1)}%`}
            awayVal={`${currentAwayBp.kbb.toFixed(1)}%`}
            homeBadge={{ symbol: currentHomeBp.kbb >= 15 ? '▲' : '▼', isPositive: currentHomeBp.kbb >= 15 }}
            awayBadge={{ symbol: currentAwayBp.kbb >= 15 ? '▲' : '▼', isPositive: currentAwayBp.kbb >= 15 }}
          />
          <CompactMetricRow
            label="피로도"
            subLabel="최근 3일 투구/연투"
            homeVal={currentHomeBp.fatigue}
            awayVal={currentAwayBp.fatigue}
            homeBadge={{ symbol: currentHomeBp.isPositive ? '▲' : '▼', isPositive: currentHomeBp.isPositive }}
            awayBadge={{ symbol: currentAwayBp.isPositive ? '▲' : '▼', isPositive: currentAwayBp.isPositive }}
          />
        </View>

        {/* 1-2-1. ⚡ [불펜 최근 3경기 흐름] (시즌 vs 최근 3G) */}
        <View style={styles.subSectionHeader}>
          <Text style={[styles.subSectionTitle, { color: '#22D3EE' }]}>
            ⚡ 1-2-1. 불펜 최근 3경기 흐름 (시즌 vs 최근 3G)
          </Text>
        </View>

        <View style={styles.card}>
          <CompactMetricRow
            label="최근 LOB%"
            subLabel="잔루율 변화"
            homeVal={`${currentHomeBp.recentLob.toFixed(1)}%`}
            awayVal={`${currentAwayBp.recentLob.toFixed(1)}%`}
            homeSeason={`${currentHomeBp.lob.toFixed(1)}%`}
            awaySeason={`${currentAwayBp.lob.toFixed(1)}%`}
            homeBadge={{
              symbol: currentHomeBp.recentLob >= currentHomeBp.lob ? '▲' : '▼',
              isPositive: currentHomeBp.recentLob >= currentHomeBp.lob,
            }}
            awayBadge={{
              symbol: currentAwayBp.recentLob >= currentAwayBp.lob ? '▲' : '▼',
              isPositive: currentAwayBp.recentLob >= currentAwayBp.lob,
            }}
          />
          <CompactMetricRow
            label="최근 WHIP"
            subLabel="출루허용 변화"
            homeVal={currentHomeBp.recentWhip.toFixed(2)}
            awayVal={currentAwayBp.recentWhip.toFixed(2)}
            homeSeason={currentHomeBp.whip.toFixed(2)}
            awaySeason={currentAwayBp.whip.toFixed(2)}
            homeBadge={{
              symbol: currentHomeBp.recentWhip <= currentHomeBp.whip ? '▲' : '▼',
              isPositive: currentHomeBp.recentWhip <= currentHomeBp.whip,
            }}
            awayBadge={{
              symbol: currentAwayBp.recentWhip <= currentAwayBp.whip ? '▲' : '▼',
              isPositive: currentAwayBp.recentWhip <= currentAwayBp.whip,
            }}
          />
          <CompactMetricRow
            label="3일 투구수"
            subLabel="연투 부하도"
            homeVal={currentHomeBp.recentPitches}
            awayVal={currentAwayBp.recentPitches}
            homeBadge={{ symbol: currentHomeBp.isPositive ? '▲' : '▼', isPositive: currentHomeBp.isPositive }}
            awayBadge={{ symbol: currentAwayBp.isPositive ? '▲' : '▼', isPositive: currentAwayBp.isPositive }}
          />
        </View>

        {/* ═══════════════════════════════════════════════ */}
        {/* ➦ 명확한 섹션 구분선 (DIVIDER) - 타자 영역 */}
        {/* ═══════════════════════════════════════════════ */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerBadge, styles.dividerBadgeBatter]}>⚔️ 타자 타선 분석 영역</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ═══════════════════════════════════════════════ */}
        {/* 2. ⚔️ [타자 파트] 타자 선택기 & 5대 핵심 지표 */}
        {/* ═══════════════════════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
            ⚔️ 2. 타자 핵심 5대 수치 비교
          </Text>
        </View>

        {/* 타자 선택기 (Home / Away) - 중심 타선 및 주요 타자 */}
        <View style={styles.pickerRow}>
          {/* 홈 타자 Picker */}
          <View style={styles.pickerBox}>
            <Text style={styles.pickerLabel}>🏠 홈 주요 타자 선택 ({homeStarter.team})</Text>
            <View style={styles.chipRow}>
              {HOME_BATTER_LIST.map((bt, idx) => (
                <TouchableOpacity
                  key={bt.id}
                  style={[
                    styles.chip,
                    selectedHomeBtIdx === idx && styles.chipActiveHomeBatter,
                  ]}
                  onPress={() => setSelectedHomeBtIdx(idx)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedHomeBtIdx === idx && styles.chipTextActive,
                    ]}
                  >
                    {bt.order} {bt.name} ({bt.position})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 원정 타자 Picker */}
          <View style={styles.pickerBox}>
            <Text style={styles.pickerLabel}>✈️ 원정 주요 타자 선택 ({awayStarter.team})</Text>
            <View style={styles.chipRow}>
              {AWAY_BATTER_LIST.map((bt, idx) => (
                <TouchableOpacity
                  key={bt.id}
                  style={[
                    styles.chip,
                    selectedAwayBtIdx === idx && styles.chipActiveAwayBatter,
                  ]}
                  onPress={() => setSelectedAwayBtIdx(idx)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedAwayBtIdx === idx && styles.chipTextActive,
                    ]}
                  >
                    {bt.order} {bt.name} ({bt.position})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 타자 5대 핵심 지표 카드 */}
        <View style={styles.card}>
          <CompactMetricRow
            label="wOBA"
            subLabel="가중 출루율"
            homeVal={currentHomeBt.woba.toFixed(3)}
            awayVal={currentAwayBt.woba.toFixed(3)}
            homeBadge={getBatterBadges(currentHomeBt.woba, currentAwayBt.woba).homeBadge}
            awayBadge={getBatterBadges(currentHomeBt.woba, currentAwayBt.woba).awayBadge}
          />
          <CompactMetricRow
            label="OPS"
            subLabel="출루율+장타율"
            homeVal={currentHomeBt.ops.toFixed(3)}
            awayVal={currentAwayBt.ops.toFixed(3)}
            homeBadge={getBatterBadges(currentHomeBt.ops, currentAwayBt.ops).homeBadge}
            awayBadge={getBatterBadges(currentHomeBt.ops, currentAwayBt.ops).awayBadge}
          />
          <CompactMetricRow
            label="RISP"
            subLabel="득점권 타율"
            homeVal={currentHomeBt.risp.toFixed(3)}
            awayVal={currentAwayBt.risp.toFixed(3)}
            homeBadge={getBatterBadges(currentHomeBt.risp, currentAwayBt.risp).homeBadge}
            awayBadge={getBatterBadges(currentHomeBt.risp, currentAwayBt.risp).awayBadge}
          />
          <CompactMetricRow
            label="BB%"
            subLabel="볼넷 비율"
            homeVal={`${currentHomeBt.bbRate.toFixed(1)}%`}
            awayVal={`${currentAwayBt.bbRate.toFixed(1)}%`}
            homeBadge={getBatterBadges(currentHomeBt.bbRate, currentAwayBt.bbRate).homeBadge}
            awayBadge={getBatterBadges(currentHomeBt.bbRate, currentAwayBt.bbRate).awayBadge}
          />
          <CompactMetricRow
            label="HardHit%"
            subLabel="강한타구비율"
            homeVal={`${currentHomeBt.hardHit.toFixed(1)}%`}
            awayVal={`${currentAwayBt.hardHit.toFixed(1)}%`}
            homeBadge={getBatterBadges(currentHomeBt.hardHit, currentAwayBt.hardHit).homeBadge}
            awayBadge={getBatterBadges(currentHomeBt.hardHit, currentAwayBt.hardHit).awayBadge}
          />
        </View>

        {/* ═══════════════════════════════════════════════ */}
        {/* 2-1. 🚀 [타자 최근 5경기 흐름] (시즌 vs 최근 5G) */}
        {/* ═══════════════════════════════════════════════ */}
        <View style={styles.subSectionHeader}>
          <Text style={[styles.subSectionTitle, { color: '#FBBF24' }]}>
            🚀 2-1. 타자 최근 5경기 흐름 (시즌 vs 최근 5G)
          </Text>
        </View>

        <View style={styles.card}>
          <CompactMetricRow
            label="최근 OPS"
            subLabel="5G 생산력 변화"
            homeVal={currentHomeBt.recent5Games.ops.toFixed(3)}
            awayVal={currentAwayBt.recent5Games.ops.toFixed(3)}
            homeSeason={currentHomeBt.ops.toFixed(3)}
            awaySeason={currentAwayBt.ops.toFixed(3)}
            homeBadge={{
              symbol: currentHomeBt.recent5Games.ops >= currentHomeBt.ops ? '▲' : '▼',
              isPositive: currentHomeBt.recent5Games.ops >= currentHomeBt.ops,
            }}
            awayBadge={{
              symbol: currentAwayBt.recent5Games.ops >= currentAwayBt.ops ? '▲' : '▼',
              isPositive: currentAwayBt.recent5Games.ops >= currentAwayBt.ops,
            }}
          />
          <CompactMetricRow
            label="최근 타율"
            subLabel="5G 타율 변화"
            homeVal={currentHomeBt.recent5Games.avg.toFixed(3)}
            awayVal={currentAwayBt.recent5Games.avg.toFixed(3)}
            homeSeason={currentHomeBt.seasonAvg.toFixed(3)}
            awaySeason={currentAwayBt.seasonAvg.toFixed(3)}
            homeBadge={{
              symbol: currentHomeBt.recent5Games.avg >= currentHomeBt.seasonAvg ? '▲' : '▼',
              isPositive: currentHomeBt.recent5Games.avg >= currentHomeBt.seasonAvg,
            }}
            awayBadge={{
              symbol: currentAwayBt.recent5Games.avg >= currentAwayBt.seasonAvg ? '▲' : '▼',
              isPositive: currentAwayBt.recent5Games.avg >= currentAwayBt.seasonAvg,
            }}
          />
          <CompactMetricRow
            label="5G 타격"
            subLabel="안타 (홈런)"
            homeVal={`${currentHomeBt.recent5Games.hits}안타 (${currentHomeBt.recent5Games.homers}HR)`}
            awayVal={`${currentAwayBt.recent5Games.hits}안타 (${currentAwayBt.recent5Games.homers}HR)`}
            homeBadge={{
              symbol: currentHomeBt.recent5Games.homers > 0 ? '▲' : '▼',
              isPositive: currentHomeBt.recent5Games.homers > 0,
            }}
            awayBadge={{
              symbol: currentAwayBt.recent5Games.homers > 0 ? '▲' : '▼',
              isPositive: currentAwayBt.recent5Games.homers > 0,
            }}
          />
          <CompactMetricRow
            label="5G 타점"
            subLabel="클러치 해결"
            homeVal={`${currentHomeBt.recent5Games.rbi}타점`}
            awayVal={`${currentAwayBt.recent5Games.rbi}타점`}
            homeBadge={getBatterBadges(currentHomeBt.recent5Games.rbi, currentAwayBt.recent5Games.rbi).homeBadge}
            awayBadge={getBatterBadges(currentHomeBt.recent5Games.rbi, currentAwayBt.recent5Games.rbi).awayBadge}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  badgeContainer: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  matchupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  teamBox: {
    flex: 1,
  },
  teamHomeTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 2,
  },
  teamAwayTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FB923C',
    marginBottom: 2,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pitcherName: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#64748B',
    paddingHorizontal: 8,
  },
  sectionHeader: {
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#60A5FA',
  },
  subSectionHeader: {
    marginTop: 10,
    marginBottom: 6,
  },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FB7185',
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 4,
    marginBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B40',
  },
  sideValueContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  centerLabelContainer: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E2E8F0',
  },
  subLabelText: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },
  valueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  seasonText: {
    fontSize: 10,
    color: '#64748B',
  },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeRed: {
    backgroundColor: '#450A0A',
    borderWidth: 0.5,
    borderColor: '#E53E3E',
  },
  badgeBlue: {
    backgroundColor: '#082F49',
    borderWidth: 0.5,
    borderColor: '#0284C7',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  badgeTextRed: {
    color: '#E53E3E',
  },
  badgeTextBlue: {
    color: '#38BDF8',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#A5B4FC',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  dividerBadgeBatter: {
    color: '#FCD34D',
    backgroundColor: '#451A03',
    borderColor: '#D97706',
  },
  pickerRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 8,
  },
  pickerBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActiveHome: {
    backgroundColor: '#1D4ED8',
    borderColor: '#60A5FA',
  },
  chipActiveAway: {
    backgroundColor: '#C2410C',
    borderColor: '#FB923C',
  },
  chipActiveHomeBatter: {
    backgroundColor: '#1E40AF',
    borderColor: '#38BDF8',
  },
  chipActiveAwayBatter: {
    backgroundColor: '#9A3412',
    borderColor: '#FB923C',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dashboardHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  dashboardHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  dashboardHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F43F5E',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FB7185',
  },
  dashboardSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  dashboard: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 12,
  },
  bannerContainer: {
    backgroundColor: 'rgba(30, 58, 138, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  bannerText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#93C5FD',
  },
  gameCardContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    marginBottom: 8,
  },
  gameCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 6,
    marginBottom: 8,
  },
  gameCardBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gameCardBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  gameCardTimeText: {
    color: '#60A5FA',
    fontWeight: 'bold',
    fontSize: 10,
    marginLeft: 6,
  },
  gameCardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameCardTeamText: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 13,
  },
  gameCardPitcherText: {
    color: '#38BDF8',
    fontSize: 10,
    marginTop: 2,
  },
  gameCardVsText: {
    color: '#64748B',
    fontWeight: '900',
    fontSize: 11,
  },
});

// ⚾ 개별 경기 카드 컴포넌트
export interface GameCardProps {
  game: any;
  onPress?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress }) => {
  const protoNo = game.betman_proto_no || (game.display_no ? String(game.display_no).replace(/[^0-9]/g, '') : '미정');
  const league = game.league || 'MLB';
  const homeTeam = game.homeTeam || game.home_team || '홈팀';
  const awayTeam = game.awayTeam || game.away_team || '원정팀';
  const homePitcher = (game.home_saber?.pitcher) || game.home_starter || '선발미정';
  const awayPitcher = (game.away_saber?.pitcher) || game.away_starter || '선발미정';
  const gameTime = game.gameTime || game.time || '18:30';

  return (
    <TouchableOpacity style={styles.gameCardContainer} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.gameCardTopRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.gameCardBadge}>
            <Text style={styles.gameCardBadgeText}>#No.{protoNo} [{league}]</Text>
          </View>
          <Text style={styles.gameCardTimeText}>⏰{gameTime}</Text>
        </View>
        <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 10 }}>
          🔥AI:{game.ai_pick || game.ai_prediction || game.recommended_pick || '승'}
        </Text>
      </View>
      <View style={styles.gameCardMainRow}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.gameCardTeamText}>{homeTeam}</Text>
          <Text style={styles.gameCardPitcherText}>{homePitcher}</Text>
        </View>
        <Text style={styles.gameCardVsText}>VS</Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.gameCardTeamText}>{awayTeam}</Text>
          <Text style={styles.gameCardPitcherText}>{awayPitcher}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ⭕ 해결책: API 응답 원본 순서(Index)를 보존하여 1:1 그대로 렌더링하는 대시보드
export interface DashboardMatchListProps {
  onSelectMatch?: (match: any) => void;
}

export const DashboardMatchList: React.FC<DashboardMatchListProps> = ({ onSelectMatch }) => {
  React.useEffect(() => {
    fetch('/api/games/active?_t=' + new Date().getTime(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then((res) => res.json())
      .then((data) => {
        // API에서 이미 벳맨 공식 순서로 정렬되어 온 21개 경기 원본 배열 순서 그대로 State 저장
        const rawList = data.games || data.matches || (Array.isArray(data) ? data : []);
        setGames(rawList);
      })
      .catch((err) => {
        console.warn('API 로드 오류 (기본 데이터 사용):', err);
      });
  }, []);

  return (
    <View style={styles.dashboard}>
      {/* ⚾ 야구 종목 자동 추출 & 벳맨 고유번호 안내 배너 */}
      <View style={styles.bannerContainer}>
        <Text style={styles.bannerText}>
          ⚾ 프로토 회차 중 [야구] 대상 경기만 자동 추출된 목록입니다.
        </Text>
      </View>

      {/* ❌ League별로 filter()나 groupBy()를 돌리지 않고, 원본 배열을 그대로 map() 순회 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {games.map((game, originalIndex) => (
          <GameCard
            key={game.betman_proto_no || originalIndex}
            game={game}
            onPress={() => onSelectMatch && onSelectMatch(game)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default MobileMatchDetailScreen;

