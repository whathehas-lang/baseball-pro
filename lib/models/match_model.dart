class MatchModel {
  final String id;
  final String betmanProtoNo;
  final String displayNo;
  final String league;
  final String gameTime;
  final String gameDate;
  final String homeTeam;
  final String awayTeam;
  final String homeStarter;
  final String awayStarter;
  final double homeEra;
  final double awayEra;
  final double homeWhip;
  final double awayWhip;
  final double homeOps;
  final double awayOps;
  final double homeWrcPlus;
  final double awayWrcPlus;
  final String aiPrediction;
  final String stadium;
  final bool isSeung1Pae;

  const MatchModel({
    required this.id,
    required this.betmanProtoNo,
    required this.displayNo,
    required this.league,
    required this.gameTime,
    required this.gameDate,
    required this.homeTeam,
    required this.awayTeam,
    required this.homeStarter,
    required this.awayStarter,
    required this.homeEra,
    required this.awayEra,
    required this.homeWhip,
    required this.awayWhip,
    required this.homeOps,
    required this.awayOps,
    required this.homeWrcPlus,
    required this.awayWrcPlus,
    required this.aiPrediction,
    required this.stadium,
    this.isSeung1Pae = true,
  });

  factory MatchModel.fromJson(Map<String, dynamic> json) {
    final homeSaber = json['home_saber'] as Map<String, dynamic>? ?? {};
    final awaySaber = json['away_saber'] as Map<String, dynamic>? ?? {};

    return MatchModel(
      id: json['betman_proto_no']?.toString() ?? json['game_seq']?.toString() ?? '',
      betmanProtoNo: json['betman_proto_no']?.toString() ?? '',
      displayNo: json['display_no']?.toString() ?? '#No.',
      league: json['league']?.toString() ?? 'KBO',
      gameTime: json['gameTime']?.toString() ?? json['time']?.toString() ?? '18:30',
      gameDate: json['gameDate']?.toString() ?? '08.25(화)',
      homeTeam: json['homeTeam']?.toString() ?? json['home_team']?.toString() ?? '',
      awayTeam: json['awayTeam']?.toString() ?? json['away_team']?.toString() ?? '',
      homeStarter: homeSaber['pitcher']?.toString() ?? json['home_starter']?.toString() ?? '선발미정',
      awayStarter: awaySaber['pitcher']?.toString() ?? json['away_starter']?.toString() ?? '선발미정',
      homeEra: (homeSaber['sp_era'] is num) ? (homeSaber['sp_era'] as num).toDouble() : (json['homeEra'] is num ? (json['homeEra'] as num).toDouble() : (double.tryParse(json['home_era']?.toString() ?? '') ?? 3.42)),
      awayEra: (awaySaber['sp_era'] is num) ? (awaySaber['sp_era'] as num).toDouble() : (json['awayEra'] is num ? (json['awayEra'] as num).toDouble() : (double.tryParse(json['away_era']?.toString() ?? '') ?? 3.75)),
      homeWhip: (homeSaber['whip'] is num) ? (homeSaber['whip'] as num).toDouble() : (json['homeWhip'] is num ? (json['homeWhip'] as num).toDouble() : (double.tryParse(json['home_whip']?.toString() ?? '') ?? 1.12)),
      awayWhip: (awaySaber['whip'] is num) ? (awaySaber['whip'] as num).toDouble() : (json['awayWhip'] is num ? (json['awayWhip'] as num).toDouble() : (double.tryParse(json['away_whip']?.toString() ?? '') ?? 1.22)),
      homeOps: (homeSaber['ops'] is num) ? (homeSaber['ops'] as num).toDouble() : (json['homeOps'] is num ? (json['homeOps'] as num).toDouble() : (double.tryParse(json['home_ops']?.toString() ?? '') ?? 0.770)),
      awayOps: (awaySaber['ops'] is num) ? (awaySaber['ops'] as num).toDouble() : (json['awayOps'] is num ? (json['awayOps'] as num).toDouble() : (double.tryParse(json['away_ops']?.toString() ?? '') ?? 0.735)),
      homeWrcPlus: (homeSaber['wrc_plus'] is num) ? (homeSaber['wrc_plus'] as num).toDouble() : (json['homeWrcPlus'] is num ? (json['homeWrcPlus'] as num).toDouble() : 110.0),
      awayWrcPlus: (awaySaber['wrc_plus'] is num) ? (awaySaber['wrc_plus'] as num).toDouble() : (json['awayWrcPlus'] is num ? (json['awayWrcPlus'] as num).toDouble() : 105.0),
      aiPrediction: json['ai_prediction']?.toString() ?? json['ai_pick']?.toString() ?? '승',
      stadium: json['stadium']?.toString() ?? '주구장',
      isSeung1Pae: json['is_seung_1_pae'] == true,
    );
  }
}
