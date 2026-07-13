export type Lang = 'ko' | 'en' | 'vi'

const strings = {
  ko: {
    // tabs
    tabRoutine: '루틴', tabLog: '로그', tabExercises: '운동', tabStats: '통계',
    // header
    logout: '로그아웃', language: '언어', adminPanel: 'Admin 패널',
    // timer
    resting: '휴식 중', startWorkout: '운동 시작', working: '● 운동 중',
    timerTotal: '총', timerWork: '운동', timerRest: '휴식', setDone: '완료',
    // log page
    addWorkout: '운동 추가', addFromRoutine: '루틴으로 추가', addExercise: '개별 운동 추가',
    addFromRoutineDesc: '저장된 루틴을 불러와 세트/무게를 입력합니다',
    addExerciseDesc: '운동을 하나 선택해 기록합니다',
    noLog: '이 날 기록이 없어요', noRoutines: '루틴 없음',
    searchRoutine: '루틴 검색...', searchExercise: '이름 검색...',
    workoutLog: '운동 기록', selectRoutine: '루틴 선택', selectExercise: '운동 선택',
    distKm: '거리(km)', timMin: '시간(분)', calories: '칼로리',
    addSet: 'Set 추가', addExInFill: '운동 추가', noSets: '입력된 세트가 없습니다',
    today: 'Today', cancel: 'Cancel', save: 'Save', add: 'Add',
    searchName: '이름 또는 한국어로 검색...',
    // stats
    workoutDays: '운동한 날', totalSets: '총 세트', totalVolume: '총 볼륨',
    volumeByMuscle: '근육별 볼륨', noData: '데이터 없음',
    logToSee: '운동을 기록하면 나타나요',
    period7: '7일', period30: '30일', period90: '90일', periodAll: '전체',
    // exercises
    searchEx: '이름 검색 (한국어/영어)...', noResults: '검색 결과 없음',
    dataLoading: '데이터 준비 중', ytLink: 'YouTube에서 폼 영상 보기',
    confirmDelete: '삭제하시겠습니까?', nameRequired: '운동 이름을 입력해주세요',
    muscleRequired: '근육 그룹을 선택해주세요', customExTitle: 'Custom Exercise',
    nameEn: 'Name (English)', nameKo: '한국어 이름 (선택)', muscleGroup: 'Muscle group',
    equipment: 'Equipment', logType: 'Log type', custom: 'custom',
    musclesWorked: 'Muscles worked',
    // routine
    noRoutinesList: '저장된 루틴이 없습니다', newRoutine: '새 루틴',
    start: 'Start', edit: 'Edit', delete: '삭제',
    // reps labels
    sets: '세트', reps: '회', sec: '초',
    // body composition
    tabBody: '바디',
    bodyWeight: '체중', bodySkeletalMuscle: '골격근량', bodyFatMass: '체지방량',
    bodyFatPct: '체지방률', bodyVisceralFat: '내장지방', bodyWaist: '허리둘레', bodyTrunkFat: 'Trunk Fat',
    bodyAddRecord: '기록 추가', bodyNoData: '체성분 기록이 없어요',
    bodyLatest: '최근 측정값', bodyTrend: '변화 추이',
    bodyKg: 'kg', bodyPct: '%', bodyCm: 'cm', bodyLevel: '레벨',
    bodyDeleteConfirm: '이 기록을 삭제하시겠습니까?',
    bodyHistory: '기록 히스토리',
  },
  en: {
    tabRoutine: 'Routine', tabLog: 'Log', tabExercises: 'Exercises', tabStats: 'Stats',
    logout: 'Logout', language: 'Language', adminPanel: 'Admin panel',
    resting: 'Resting', startWorkout: 'Start workout', working: '● Working out',
    timerTotal: 'Total', timerWork: 'Workout', timerRest: 'Rest', setDone: 'Done',
    addWorkout: 'Add workout', addFromRoutine: 'Add from routine', addExercise: 'Add exercise',
    addFromRoutineDesc: 'Load a saved routine and enter sets & weight',
    addExerciseDesc: 'Select an exercise to log',
    noLog: 'No workouts logged', noRoutines: 'No routines',
    searchRoutine: 'Search routines...', searchExercise: 'Search exercises...',
    workoutLog: 'Workout log', selectRoutine: 'Select routine', selectExercise: 'Select exercise',
    distKm: 'Distance (km)', timMin: 'Time (min)', calories: 'Calories',
    addSet: 'Add set', addExInFill: 'Add exercise', noSets: 'No sets entered',
    today: 'Today', cancel: 'Cancel', save: 'Save', add: 'Add',
    searchName: 'Search name...',
    workoutDays: 'Workout days', totalSets: 'Total sets', totalVolume: 'Total volume',
    volumeByMuscle: 'Volume by muscle', noData: 'No data',
    logToSee: 'Log workouts to see data',
    period7: '7 days', period30: '30 days', period90: '90 days', periodAll: 'All',
    searchEx: 'Search name...', noResults: 'No results',
    dataLoading: 'Loading data', ytLink: 'Watch form video on YouTube',
    confirmDelete: 'Delete?', nameRequired: 'Exercise name required',
    muscleRequired: 'Select muscle group', customExTitle: 'Custom Exercise',
    nameEn: 'Name (English)', nameKo: 'Korean name (optional)', muscleGroup: 'Muscle group',
    equipment: 'Equipment', logType: 'Log type', custom: 'custom',
    musclesWorked: 'Muscles worked',
    noRoutinesList: 'No routines saved', newRoutine: 'New routine',
    start: 'Start', edit: 'Edit', delete: 'Delete',
    sets: 'sets', reps: 'reps', sec: 's',
    tabBody: 'Body',
    bodyWeight: 'Weight', bodySkeletalMuscle: 'Skeletal Muscle', bodyFatMass: 'Body Fat Mass',
    bodyFatPct: 'Body Fat %', bodyVisceralFat: 'Visceral Fat', bodyWaist: 'Waist', bodyTrunkFat: 'Trunk Fat',
    bodyAddRecord: 'Add Record', bodyNoData: 'No body composition data',
    bodyLatest: 'Latest', bodyTrend: 'Trend',
    bodyKg: 'kg', bodyPct: '%', bodyCm: 'cm', bodyLevel: 'level',
    bodyDeleteConfirm: 'Delete this record?',
    bodyHistory: 'History',
  },
  vi: {
    tabRoutine: 'Lịch tập', tabLog: 'Nhật ký', tabExercises: 'Bài tập', tabStats: 'Thống kê',
    logout: 'Đăng xuất', language: 'Ngôn ngữ', adminPanel: 'Bảng quản trị',
    resting: 'Đang nghỉ', startWorkout: 'Bắt đầu tập', working: '● Đang tập',
    timerTotal: 'Tổng', timerWork: 'Tập', timerRest: 'Nghỉ', setDone: 'Xong',
    addWorkout: 'Thêm bài tập', addFromRoutine: 'Thêm từ lịch tập', addExercise: 'Thêm bài tập lẻ',
    addFromRoutineDesc: 'Tải lịch tập đã lưu và nhập set/tạ',
    addExerciseDesc: 'Chọn bài tập để ghi lại',
    noLog: 'Chưa có nhật ký hôm nay', noRoutines: 'Không có lịch tập',
    searchRoutine: 'Tìm lịch tập...', searchExercise: 'Tìm bài tập...',
    workoutLog: 'Nhật ký tập', selectRoutine: 'Chọn lịch tập', selectExercise: 'Chọn bài tập',
    distKm: 'Quãng đường (km)', timMin: 'Thời gian (phút)', calories: 'Calo',
    addSet: 'Thêm set', addExInFill: 'Thêm bài tập', noSets: 'Chưa nhập set nào',
    today: 'Hôm nay', cancel: 'Hủy', save: 'Lưu', add: 'Thêm',
    searchName: 'Tìm tên bài tập...',
    workoutDays: 'Ngày tập', totalSets: 'Tổng set', totalVolume: 'Tổng khối lượng',
    volumeByMuscle: 'Khối lượng theo cơ', noData: 'Không có dữ liệu',
    logToSee: 'Hãy ghi lại để xem dữ liệu',
    period7: '7 ngày', period30: '30 ngày', period90: '90 ngày', periodAll: 'Tất cả',
    searchEx: 'Tìm tên bài tập...', noResults: 'Không tìm thấy',
    dataLoading: 'Đang tải', ytLink: 'Xem video hướng dẫn trên YouTube',
    confirmDelete: 'Xóa?', nameRequired: 'Cần nhập tên bài tập',
    muscleRequired: 'Chọn nhóm cơ', customExTitle: 'Bài tập tùy chỉnh',
    nameEn: 'Tên (tiếng Anh)', nameKo: 'Tên tiếng Hàn (tùy chọn)', muscleGroup: 'Nhóm cơ',
    equipment: 'Thiết bị', logType: 'Loại ghi lại', custom: 'tùy chỉnh',
    musclesWorked: 'Cơ được tập',
    noRoutinesList: 'Chưa có lịch tập nào', newRoutine: 'Lịch tập mới',
    start: 'Bắt đầu', edit: 'Chỉnh sửa', delete: 'Xóa',
    sets: 'sets', reps: 'reps', sec: 's',
    tabBody: 'Thân thể',
    bodyWeight: 'Cân nặng', bodySkeletalMuscle: 'Cơ xương', bodyFatMass: 'Khối mỡ',
    bodyFatPct: '% Mỡ cơ thể', bodyVisceralFat: 'Mỡ nội tạng', bodyWaist: 'Vòng eo', bodyTrunkFat: 'Trunk Fat',
    bodyAddRecord: 'Thêm chỉ số', bodyNoData: 'Chưa có dữ liệu thành phần cơ thể',
    bodyLatest: 'Gần nhất', bodyTrend: 'Xu hướng',
    bodyKg: 'kg', bodyPct: '%', bodyCm: 'cm', bodyLevel: 'mức',
    bodyDeleteConfirm: 'Xóa bản ghi này?',
    bodyHistory: 'Lịch sử',
  },
} as const

export type TKey = keyof typeof strings.ko
export function tr(lang: Lang, key: TKey): string {
  return strings[lang][key] ?? strings.en[key]
}

/** Exercise display name based on language */
export function exName(ex: { name: string; ko?: string }, lang: Lang): { main: string; sub?: string } {
  if (lang === 'ko' && ex.ko) return { main: ex.ko, sub: ex.name }
  return { main: ex.name }
}

export const LANG_LABELS: Record<Lang, string> = {
  ko: '한국어', en: 'English', vi: 'Tiếng Việt',
}
