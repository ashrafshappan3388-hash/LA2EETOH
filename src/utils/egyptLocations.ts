export interface DistrictEntry {
  id: string;
  nameEn: string;
  nameAr: string;
  lat: number;
  lng: number;
}

export interface CityEntry {
  id: string;
  nameEn: string;
  nameAr: string;
  lat: number;
  lng: number;
  districts: DistrictEntry[];
}

export interface GovernorateEntry {
  id: string;
  nameEn: string;
  nameAr: string;
  lat: number;
  lng: number;
  cities: CityEntry[];
}

export const EGYPT_GOVERNORATES: GovernorateEntry[] = [
  {
    id: 'cairo',
    nameEn: 'Cairo',
    nameAr: 'القاهرة',
    lat: 30.0444,
    lng: 31.2357,
    cities: [
      {
        id: 'nasr-city',
        nameEn: 'Nasr City',
        nameAr: 'مدينة نصر',
        lat: 30.0511,
        lng: 31.3656,
        districts: [
          { id: 'abbas-el-akkad', nameEn: 'Abbas El Akkad', nameAr: 'عباس العقاد', lat: 30.0566, lng: 31.3396 },
          { id: 'makram-ebeid', nameEn: 'Makram Ebeid', nameAr: 'مكرم عبيد', lat: 30.0612, lng: 31.3489 },
          { id: 'mostafa-el-nahhas', nameEn: 'Mostafa El Nahhas', nameAr: 'مصطفى النحاس', lat: 30.0548, lng: 31.3562 },
          { id: 'el-tayaran', nameEn: 'El Tayaran & Rabaa', nameAr: 'الطيران ورابعة العدوية', lat: 30.0668, lng: 31.3292 },
          { id: '7th-district-nasr', nameEn: '7th District (Al Hay Al Sabea)', nameAr: 'الحي السابع', lat: 30.0448, lng: 31.3435 },
          { id: '8th-district-nasr', nameEn: '8th District & Al Manhal', nameAr: 'الحي الثامن والمنهل', lat: 30.0504, lng: 31.3702 },
          { id: 'al-hay-al-asher', nameEn: '10th District', nameAr: 'الحي العاشر', lat: 30.0492, lng: 31.3847 },
          { id: 'hay-el-sefarat', nameEn: 'Diplomatic Quarter (Sefarat)', nameAr: 'حي السفارات', lat: 30.0472, lng: 31.3578 },
          { id: 'zahraa-nasr-city', nameEn: 'Zahraa Nasr City', nameAr: 'زهراء مدينة نصر', lat: 30.0412, lng: 31.3911 },
          { id: 'al-wafa-wal-amal', nameEn: 'Al Wafa Wal Amal & Al Amal City', nameAr: 'الوفاء والأمل وعزبة الهجانة', lat: 30.0631, lng: 31.3974 },
        ],
      },
      {
        id: 'mokattam',
        nameEn: 'El Mokattam',
        nameAr: 'المقطم',
        lat: 30.0112,
        lng: 31.2986,
        districts: [
          { id: 'mokattam-upper', nameEn: 'Upper Plateau (Al Hadaba Al Olya)', nameAr: 'الهضبة العليا - المقطم', lat: 30.0138, lng: 31.2889 },
          { id: 'mokattam-street-9', nameEn: 'Street 9 & Al Nafoura Square', nameAr: 'شارع 9 وميدان النافورة', lat: 30.0115, lng: 31.2838 },
          { id: 'mokattam-middle', nameEn: 'Middle Plateau (Al Hadaba Al Wosta)', nameAr: 'الهضبة الوسطى', lat: 29.9924, lng: 31.3095 },
          { id: 'mokattam-lower', nameEn: 'Lower Plateau (Masaken El Zelzal)', nameAr: 'الهضبة السفلى ومساكن الزلزال', lat: 30.0221, lng: 31.2952 },
          { id: 'al-asmarat', nameEn: 'Al Asmarat', nameAr: 'الأسمرات', lat: 30.0011, lng: 31.3358 },
          { id: 'corniche-mokattam', nameEn: 'Mokattam Corniche & Uptown', nameAr: 'كورنيش المقطم وأب تاون كايرو', lat: 30.0285, lng: 31.2896 },
        ],
      },
      {
        id: 'el-khalifa',
        nameEn: 'El Khalifa & Citadel',
        nameAr: 'الخليفة والقلعة',
        lat: 30.0258,
        lng: 31.2584,
        districts: [
          { id: 'sayeda-aisha', nameEn: 'Sayeda Aisha Square', nameAr: 'ميدان السيدة عائشة', lat: 30.0265, lng: 31.2589 },
          { id: 'citadel-khalifa', nameEn: 'Saladin Citadel & Al Qalaa', nameAr: 'القلعة', lat: 30.0287, lng: 31.2599 },
          { id: 'el-abageya', nameEn: 'El Abageya', nameAr: 'الأباجية', lat: 30.0218, lng: 31.2698 },
          { id: 'imam-el-shafii', nameEn: 'Al Imam El Shafii', nameAr: 'الإمام الشافعي', lat: 30.0124, lng: 31.2571 },
          { id: 'el-tounsy', nameEn: 'El Tounsy', nameAr: 'التونسي', lat: 30.0094, lng: 31.2662 },
          { id: 'helmya-el-gedida', nameEn: 'Helmya El Gedida & Arab El Yasar', nameAr: 'الحلمية الجديدة وعرب اليسار', lat: 30.0329, lng: 31.2574 },
          { id: 'el-darb-el-ahmar', nameEn: 'El Darb El Ahmar', nameAr: 'الدرب الأحمر', lat: 30.0389, lng: 31.2564 },
        ],
      },
      {
        id: 'sayeda-zeinab',
        nameEn: 'El Sayeda Zeinab & Old Cairo',
        nameAr: 'السيدة زينب ومصر القديمة',
        lat: 30.0221,
        lng: 31.2335,
        districts: [
          { id: 'sayeda-zeinab-sq', nameEn: 'Sayeda Zeinab Square', nameAr: 'ميدان السيدة زينب', lat: 30.0319, lng: 31.2417 },
          { id: 'el-monira-cairo', nameEn: 'El Monira & Kasr El Aini', nameAr: 'المنيرة والقصر العيني', lat: 30.0338, lng: 31.2329 },
          { id: 'fom-el-khalig', nameEn: 'Fom El Khalig & Magra El Oyoun', nameAr: 'فم الخليج ومجرى العيون', lat: 30.0212, lng: 31.2305 },
          { id: 'el-manial', nameEn: 'Al Manial (Roda Island)', nameAr: 'المنيل', lat: 30.0219, lng: 31.2248 },
          { id: 'el-fustat', nameEn: 'El Fustat & Coptic Cairo', nameAr: 'الفسطاط ومجمع الأديان', lat: 30.0061, lng: 31.2309 },
          { id: 'el-malek-el-saleh', nameEn: 'El Malek El Saleh & Zahraa Old Cairo', nameAr: 'الملك الصالح وأثر النبي', lat: 29.9989, lng: 31.2326 },
        ],
      },
      {
        id: 'new-cairo',
        nameEn: 'New Cairo',
        nameAr: 'القاهرة الجديدة',
        lat: 30.0074,
        lng: 31.4913,
        districts: [
          { id: 'fifth-settlement', nameEn: 'Fifth Settlement', nameAr: 'التجمع الخامس', lat: 30.0156, lng: 31.4408 },
          { id: 'first-settlement', nameEn: 'First Settlement', nameAr: 'التجمع الأول', lat: 30.0488, lng: 31.4547 },
          { id: 'third-settlement', nameEn: 'Third Settlement', nameAr: 'التجمع الثالث', lat: 29.9885, lng: 31.4402 },
          { id: '90th-street', nameEn: '90th Street (North & South)', nameAr: 'شارع التسعين الشمالي والجنوبي', lat: 30.0245, lng: 31.4782 },
          { id: 'rehab-city', nameEn: 'Al Rehab', nameAr: 'الرحاب', lat: 30.0598, lng: 31.4932 },
          { id: 'madinaty', nameEn: 'Madinaty', nameAr: 'مدينتي', lat: 30.0955, lng: 31.6397 },
          { id: 'al-narges-lotus', nameEn: 'Al Narges & Al Lotus', nameAr: 'النرجس واللوتس', lat: 30.0091, lng: 31.4754 },
          { id: 'andalus-beit-watan', nameEn: 'Al Andalus & Beit Al Watan', nameAr: 'الأندلس وبيت الوطن', lat: 30.0191, lng: 31.5295 },
        ],
      },
      {
        id: 'heliopolis',
        nameEn: 'Heliopolis & El Nozha',
        nameAr: 'مصر الجديدة والنزهة',
        lat: 30.0897,
        lng: 31.3292,
        districts: [
          { id: 'korba', nameEn: 'Al Korba & Roxy', nameAr: 'الكوربة وروكسي', lat: 30.0912, lng: 31.3248 },
          { id: 'merghany', nameEn: 'El Merghany & Safir', nameAr: 'الميرغني وميدان سفير', lat: 30.0825, lng: 31.3356 },
          { id: 'sheraton', nameEn: 'Sheraton Heliopolis', nameAr: 'مساكن شيراتون', lat: 30.1049, lng: 31.3775 },
          { id: 'el-hegaz-triumph', nameEn: 'El Hegaz & Triumph', nameAr: 'الحجاز وتريومف وسانت فاتيما', lat: 30.1018, lng: 31.3411 },
          { id: 'almaza-nozha', nameEn: 'Almaza & New Nozha', nameAr: 'ألماظة والنزهة الجديدة', lat: 30.0928, lng: 31.3612 },
          { id: 'gesr-el-suez', nameEn: 'Gesr El Suez', nameAr: 'جسر السويس', lat: 30.1185, lng: 31.3519 },
        ],
      },
      {
        id: 'maadi',
        nameEn: 'Maadi & Tora',
        nameAr: 'المعادي وطرة',
        lat: 29.9602,
        lng: 31.2569,
        districts: [
          { id: 'degla', nameEn: 'Degla Maadi', nameAr: 'دجلة المعادي', lat: 29.9585, lng: 31.2752 },
          { id: 'sarayat', nameEn: 'Sarayat El Maadi', nameAr: 'سرايات المعادي', lat: 29.9631, lng: 31.2581 },
          { id: 'zahraa-maadi', nameEn: 'Zahraa El Maadi', nameAr: 'زهراء المعادي', lat: 29.9652, lng: 31.3075 },
          { id: 'new-maadi', nameEn: 'New Maadi & Corniche', nameAr: 'المعادي الجديدة وكورنيش المعادي', lat: 29.9742, lng: 31.2738 },
          { id: 'hadayek-maadi', nameEn: 'Hadayek El Maadi', nameAr: 'حدائق المعادي', lat: 29.9699, lng: 31.2512 },
          { id: 'tora-kotsika', nameEn: 'Tora & Kotsika', nameAr: 'طرة البلد وكوتسيكا', lat: 29.9355, lng: 31.2814 },
        ],
      },
      {
        id: 'el-basatin',
        nameEn: 'El Basatin & Dar El Salam',
        nameAr: 'البساتين ودار السلام',
        lat: 29.9854,
        lng: 31.2688,
        districts: [
          { id: 'el-basatin-center', nameEn: 'El Basatin & Sakr Quraish', nameAr: 'البساتين وصقر قريش', lat: 29.9862, lng: 31.2815 },
          { id: 'dar-el-salam', nameEn: 'Dar El Salam', nameAr: 'دار السلام', lat: 29.9822, lng: 31.2422 },
          { id: 'al-mearag', nameEn: 'Al Mearag City', nameAr: 'مدينة المعراج', lat: 29.9781, lng: 31.3189 },
          { id: 'ezbet-el-nasr', nameEn: 'Ezbet El Nasr & Autostrad', nameAr: 'عزبة النصر والأوتوستراد', lat: 29.9942, lng: 31.2775 },
        ],
      },
      {
        id: 'helwan',
        nameEn: 'Helwan, El Maasara & 15th of May',
        nameAr: 'حلوان والمعصرة والتبين و15 مايو',
        lat: 29.8414,
        lng: 31.3008,
        districts: [
          { id: 'helwan-center', nameEn: 'Central Helwan', nameAr: 'وسط حلوان', lat: 29.8414, lng: 31.3342 },
          { id: 'hadayek-helwan', nameEn: 'Hadayek Helwan & Wadi Hof', nameAr: 'حدائق حلوان ووادي حوف', lat: 29.8824, lng: 31.3125 },
          { id: 'el-maasara', nameEn: 'El Maasara', nameAr: 'المعصرة', lat: 29.9041, lng: 31.2984 },
          { id: 'el-tebbin', nameEn: 'El Tebbin & Kafr El Elw', nameAr: 'التبين وكفر العلو', lat: 29.7892, lng: 31.2948 },
          { id: '15-may-city', nameEn: '15th of May City', nameAr: 'مدينة 15 مايو', lat: 29.8265, lng: 31.3742 },
        ],
      },
      {
        id: 'downtown-cairo',
        nameEn: 'Downtown, Zamalek & Historic Cairo',
        nameAr: 'وسط البلد والزمالك والجمالية وبولاق',
        lat: 30.0488,
        lng: 31.2361,
        districts: [
          { id: 'tahrir', nameEn: 'Tahrir Square & Bab El Louk', nameAr: 'ميدان التحرير وباب اللوق', lat: 30.0444, lng: 31.2357 },
          { id: 'ramses', nameEn: 'Ramses & El Azbakeya', nameAr: 'رمسيس والأزبكية', lat: 30.0626, lng: 31.2464 },
          { id: 'zamalek', nameEn: 'Zamalek', nameAr: 'الزمالك', lat: 30.0609, lng: 31.2197 },
          { id: 'garden-city', nameEn: 'Garden City', nameAr: 'جاردن سيتي', lat: 30.0365, lng: 31.2314 },
          { id: 'abdeen-attaba', nameEn: 'Abdeen & El Attaba', nameAr: 'عابدين والعتبة', lat: 30.0491, lng: 31.2478 },
          { id: 'gamaliya-khan', nameEn: 'El Gamaliya, Al Hussein & Moski', nameAr: 'الجمالية والحسين والموسكي', lat: 30.0478, lng: 31.2623 },
          { id: 'bab-el-shaariya', nameEn: 'Bab El Shaariya & El Daher', nameAr: 'باب الشعرية والظاهر', lat: 30.0568, lng: 31.2582 },
          { id: 'bulaq-abu-el-ela', nameEn: 'Bulaq Abu El Ela & Maspero', nameAr: 'بولاق أبو العلا وماسبيرو', lat: 30.0558, lng: 31.2298 },
        ],
      },
      {
        id: 'abbasiya-weili',
        nameEn: 'Abbasiya, El Weili & Hadayek El Kobba',
        nameAr: 'العباسية والوايلي وحدائق القبة',
        lat: 30.0725,
        lng: 31.2824,
        districts: [
          { id: 'abbasiya-sq', nameEn: 'Abbasiya & El Weili', nameAr: 'العباسية والوايلي', lat: 30.0725, lng: 31.2824 },
          { id: 'hadayek-el-kobba', nameEn: 'Hadayek El Kobba', nameAr: 'حدائق القبة', lat: 30.0885, lng: 31.2845 },
          { id: 'saray-hammamat-kobba', nameEn: 'Saray & Hammamat El Kobba', nameAr: 'سراي وحمامات القبة', lat: 30.0982, lng: 31.2981 },
          { id: 'manshiyat-nasser', nameEn: 'Manshiyat Nasser & Duweiqa', nameAr: 'منشأة ناصر والدويقة', lat: 30.0442, lng: 31.2821 },
        ],
      },
      {
        id: 'zeitoun-matareya',
        nameEn: 'El Zeitoun, El Matareya & Ain Shams',
        nameAr: 'الزيتون والأميرية والمطرية وعين شمس',
        lat: 30.1194,
        lng: 31.3189,
        districts: [
          { id: 'el-zeitoun', nameEn: 'El Zeitoun & Helmyet El Zeitoun', nameAr: 'الزيتون وحلمية الزيتون', lat: 30.1068, lng: 31.3095 },
          { id: 'el-amiriya', nameEn: 'El Amiriya & El Sawah', nameAr: 'الأميرية والسواح', lat: 30.1112, lng: 31.2889 },
          { id: 'el-matareya', nameEn: 'El Matareya', nameAr: 'المطرية', lat: 30.1235, lng: 31.3135 },
          { id: 'ain-shams', nameEn: 'Ain Shams & Alf Maskan', nameAr: 'عين شمس والألف مسكن', lat: 30.1304, lng: 31.3442 },
        ],
      },
      {
        id: 'el-marg-salam',
        nameEn: 'El Marg & El Salam',
        nameAr: 'المرج والسلام',
        lat: 30.1575,
        lng: 31.3439,
        districts: [
          { id: 'el-marg-center', nameEn: 'El Marg & Ezbet El Nakhl', nameAr: 'المرج وعزبة النخل', lat: 30.1538, lng: 31.3358 },
          { id: 'madinet-el-salam', nameEn: 'El Salam City', nameAr: 'مدينة السلام', lat: 30.1652, lng: 31.4041 },
          { id: 'el-nahda', nameEn: 'El Nahda', nameAr: 'مدينة النهضة', lat: 30.1755, lng: 31.4312 },
        ],
      },
      {
        id: 'shubra',
        nameEn: 'Shubra, El Sharabiya & El Zawya',
        nameAr: 'شبرا والساحل والشرابية والزاوية الحمراء',
        lat: 30.0754,
        lng: 31.2452,
        districts: [
          { id: 'rod-el-farag', nameEn: 'Rod El Farag & Massarra', nameAr: 'روض الفرج ومسرة', lat: 30.0789, lng: 31.2392 },
          { id: 'el-sahel', nameEn: 'El Sahel & El Khalafawy', nameAr: 'الساحل والخلفاوي والمظلات', lat: 30.0894, lng: 31.2435 },
          { id: 'el-sharabiya', nameEn: 'El Sharabiya', nameAr: 'الشرابية', lat: 30.0762, lng: 31.2588 },
          { id: 'zawya-el-hamra', nameEn: 'El Zawya El Hamra', nameAr: 'الزاوية الحمراء', lat: 30.0975, lng: 31.2678 },
        ],
      },
      {
        id: 'shorouk-badr-capital',
        nameEn: 'El Shorouk, Badr & New Administrative Capital',
        nameAr: 'الشروق وبدر والعاصمة الإدارية',
        lat: 30.1208,
        lng: 31.6309,
        districts: [
          { id: 'el-shorouk', nameEn: 'El Shorouk City', nameAr: 'مدينة الشروق', lat: 30.1208, lng: 31.6122 },
          { id: 'badr-city', nameEn: 'Badr City & Capital Gardens', nameAr: 'مدينة بدر وحدائق العاصمة', lat: 30.1369, lng: 31.7145 },
          { id: 'new-admin-capital', nameEn: 'New Administrative Capital', nameAr: 'العاصمة الإدارية الجديدة', lat: 30.0135, lng: 31.7375 },
        ],
      },
    ],
  },
  {
    id: 'giza',
    nameEn: 'Giza',
    nameAr: 'الجيزة',
    lat: 30.0131,
    lng: 31.2089,
    cities: [
      {
        id: 'dokki',
        nameEn: 'Dokki, Mohandessin & Agouza',
        nameAr: 'الدقي والمهندسين والعجوزة',
        lat: 30.0384,
        lng: 31.2116,
        districts: [
          { id: 'dokki-sq', nameEn: 'Dokki Square & Messaha', nameAr: 'ميدان الدقي والمساحة', lat: 30.0386, lng: 31.2122 },
          { id: 'mohandessin', nameEn: 'Mohandessin & Lebanon Sq', nameAr: 'المهندسين وميدان لبنان', lat: 30.0561, lng: 31.2015 },
          { id: 'agouza', nameEn: 'Agouza & Sphinx Sq', nameAr: 'العجوزة وميدان سفنكس', lat: 30.0528, lng: 31.2134 },
          { id: 'mit-okba-ard-el-lewa', nameEn: 'Mit Okba & Ard El Lewa', nameAr: 'ميت عقبة وأرض اللواء', lat: 30.0625, lng: 31.1924 },
        ],
      },
      {
        id: 'giza-central',
        nameEn: 'South Giza, Bulaq El Dakrour & Omraniya',
        nameAr: 'حي الجيزة وبولاق الدكرور والعمرانية',
        lat: 30.0081,
        lng: 31.2028,
        districts: [
          { id: 'giza-square', nameEn: 'Giza Square & Cairo University', nameAr: 'ميدان الجيزة وجامعة القاهرة', lat: 30.0155, lng: 31.2105 },
          { id: 'el-moneeb', nameEn: 'El Moneeb & Sakyet Mekky', nameAr: 'المنيب وساقية مكي', lat: 29.9818, lng: 31.2119 },
          { id: 'bulaq-el-dakrour', nameEn: 'Bulaq El Dakrour & Safet El Laban', nameAr: 'بولاق الدكرور وصفط اللبن', lat: 30.0258, lng: 31.1865 },
          { id: 'el-omraniya', nameEn: 'El Omraniya & El Talbiya', nameAr: 'العمرانية والطالبية', lat: 29.9975, lng: 31.1945 },
        ],
      },
      {
        id: 'imbaba-warraq',
        nameEn: 'Imbaba, El Warraq & Kerdasa',
        nameAr: 'إمبابة والوراق وأوسيم وكرداسة',
        lat: 30.0762,
        lng: 31.1985,
        districts: [
          { id: 'imbaba-center', nameEn: 'Imbaba & Kit Kat', nameAr: 'إمبابة والكيت كات', lat: 30.0719, lng: 31.2098 },
          { id: 'el-monira-gharbiya', nameEn: 'Al Monira Al Gharbiya & Bashtil', nameAr: 'المنيرة الغربية وبشتيل', lat: 30.0885, lng: 31.1872 },
          { id: 'el-warraq', nameEn: 'El Warraq', nameAr: 'الوراق', lat: 30.1012, lng: 31.2045 },
          { id: 'awsīm-manshaat', nameEn: 'Awsīm & Manshaat El Qanater', nameAr: 'أوسيم ومنشأة القناطر', lat: 30.1235, lng: 31.1328 },
          { id: 'kerdasa', nameEn: 'Kerdasa & Nahia', nameAr: 'كرداسة وناهيا', lat: 30.0308, lng: 31.1122 },
        ],
      },
      {
        id: '6-october',
        nameEn: '6th of October City',
        nameAr: 'مدينة 6 أكتوبر',
        lat: 29.9527,
        lng: 30.9219,
        districts: [
          { id: 'el-hosary', nameEn: 'El Hosary', nameAr: 'الحصري', lat: 29.9726, lng: 30.9438 },
          { id: 'motamayez', nameEn: 'Al Motamayez District', nameAr: 'الحي المتميز', lat: 29.9921, lng: 30.9642 },
          { id: 'hadayek-october', nameEn: 'Hadayek October', nameAr: 'حدائق أكتوبر', lat: 29.9145, lng: 30.9855 },
          { id: 'october-districts-1-6', nameEn: 'Districts 1st - 6th', nameAr: 'الأحياء من الأول إلى السادس', lat: 29.9585, lng: 30.9165 },
          { id: 'october-districts-7-12', nameEn: 'Districts 7th - 12th & West Somid', nameAr: 'الأحياء 7 إلى 12 وغرب سوميد', lat: 29.9795, lng: 30.9298 },
          { id: 'new-october', nameEn: 'New October City', nameAr: 'أكتوبر الجديدة', lat: 29.8825, lng: 30.8245 },
        ],
      },
      {
        id: 'sheikh-zayed',
        nameEn: 'Sheikh Zayed City',
        nameAr: 'الشيخ زايد',
        lat: 30.0372,
        lng: 30.9838,
        districts: [
          { id: 'arkan-plaza', nameEn: 'Central Axis / Arkan', nameAr: 'المحور المركزي / أركان', lat: 30.0235, lng: 31.0021 },
          { id: 'zayed-1st', nameEn: '1st - 8th Districts Zayed', nameAr: 'الأحياء 1 إلى 8 زايد', lat: 30.0442, lng: 30.9881 },
          { id: 'beverly-new-zayed', nameEn: 'Beverly Hills & New Zayed', nameAr: 'بيفرلي هيلز وزايد الجديدة', lat: 30.0725, lng: 30.9554 },
        ],
      },
      {
        id: 'haram-faisal',
        nameEn: 'Al Haram, Faisal & Hadayek El Ahram',
        nameAr: 'الهرم وفيصل وحدائق الأهرام',
        lat: 29.9912,
        lng: 31.1588,
        districts: [
          { id: 'pyramids-area', nameEn: 'Hadayek El Ahram & Remaya', nameAr: 'حدائق الأهرام وميدان الرماية', lat: 29.9773, lng: 31.1125 },
          { id: 'faisal', nameEn: 'Faisal Street (El Marioutiya - El Tawabik)', nameAr: 'شارع فيصل (المريوطية - الطوابق - العشرين)', lat: 30.0085, lng: 31.1765 },
          { id: 'haram-street', nameEn: 'Al Haram Street (Mishal - El Matbaa)', nameAr: 'شارع الهرم (مشعل - المطبعة - كوم الأخضر)', lat: 29.9922, lng: 31.1562 },
        ],
      },
      {
        id: 'south-giza-centers',
        nameEn: 'Hawamdiya, Badrashein, El Ayat & El Saff',
        nameAr: 'مراكز جنوب الجيزة (الحوامدية والبدرشين والصف)',
        lat: 29.8565,
        lng: 31.2642,
        districts: [
          { id: 'hawamdiya-abu-nomros', nameEn: 'Al Hawamdiya & Abu El Nomros', nameAr: 'الحوامدية وأبو النمرس', lat: 29.9082, lng: 31.2584 },
          { id: 'badrashein-ayat', nameEn: 'El Badrashein & El Ayat', nameAr: 'البدرشين والعياط', lat: 29.8524, lng: 31.2678 },
          { id: 'el-saff-atfih', nameEn: 'El Saff & Atfih', nameAr: 'الصف وأطفيح', lat: 29.5665, lng: 31.2812 },
          { id: 'bahariya-oasis', nameEn: 'Bahariya Oasis', nameAr: 'الواحات البحرية', lat: 28.3489, lng: 28.8647 },
        ],
      },
    ],
  },
  {
    id: 'alexandria',
    nameEn: 'Alexandria',
    nameAr: 'الإسكندرية',
    lat: 31.2001,
    lng: 29.9187,
    cities: [
      {
        id: 'sidi-gaber',
        nameEn: 'Sharq, Sidi Gaber & Smouha',
        nameAr: 'شرق الإسكندرية (سيدي جابر وسموحة)',
        lat: 31.2156,
        lng: 29.9422,
        districts: [
          { id: 'smouha', nameEn: 'Smouha', nameAr: 'سموحة', lat: 31.2098, lng: 29.9498 },
          { id: 'sidi-gaber-st', nameEn: 'Sidi Gaber & Sporting', nameAr: 'سيدي جابر وسبورتنج', lat: 31.2191, lng: 29.9412 },
          { id: 'kafr-abdo', nameEn: 'Kafr Abdo & Roushdy', nameAr: 'كفر عبده ورشدي', lat: 31.2244, lng: 29.9532 },
          { id: 'gleem-san-stefano', nameEn: 'Gleem, Louran & San Stefano', nameAr: 'جليم ولوران وسان ستيفانو', lat: 31.2422, lng: 29.9665 },
          { id: 'victoria-bakos', nameEn: 'Victoria, Fleming & Bakos', nameAr: 'فيكتوريا وفلمنج وباكوس', lat: 31.2395, lng: 29.9742 },
          { id: 'ibrahimia-camp', nameEn: 'El Ibrahimia & Camp Caesar', nameAr: 'الإبراهيمية وكامب شيزار', lat: 31.2135, lng: 29.9278 },
        ],
      },
      {
        id: 'montaza',
        nameEn: 'Al Montaza (1st & 2nd)',
        nameAr: 'المنتزه أول وثان',
        lat: 31.2755,
        lng: 30.0112,
        districts: [
          { id: 'miami', nameEn: 'Miami & El Asafra', nameAr: 'ميامي والعصافرة', lat: 31.2667, lng: 29.9922 },
          { id: 'sidi-bishr', nameEn: 'Sidi Bishr', nameAr: 'سيدي بشر', lat: 31.2588, lng: 29.9854 },
          { id: 'mandara', nameEn: 'El Mandara', nameAr: 'المندرة', lat: 31.2812, lng: 30.0185 },
          { id: 'maamoura-abu-qir', nameEn: 'El Maamoura & Abu Qir', nameAr: 'المعمورة وأبو قير وطوسون', lat: 31.3095, lng: 30.0562 },
        ],
      },
      {
        id: 'central-alex',
        nameEn: 'Central Alexandria & El Gomrok',
        nameAr: 'وسط الإسكندرية والجمرك وبحري',
        lat: 31.1995,
        lng: 29.9045,
        districts: [
          { id: 'mahatet-el-raml', nameEn: 'Mahatet El Raml & El Manshiya', nameAr: 'محطة الرمل والمنشية', lat: 31.2004, lng: 29.9012 },
          { id: 'azareeta', nameEn: 'El Azareeta & El Shatby', nameAr: 'الأزاريطة والشاطبي', lat: 31.2054, lng: 29.9114 },
          { id: 'stanley', nameEn: 'Stanley & Saba Pasha', nameAr: 'ستانلي وسابا باشا', lat: 31.2335, lng: 29.9492 },
          { id: 'moharam-bek', nameEn: 'Moharam Bek & Kom El Dikka', nameAr: 'محرم بك وكوم الدكة والحضرة', lat: 31.1904, lng: 29.9145 },
          { id: 'gomrok-bahary', nameEn: 'El Gomrok, Bahary & Anfoushi', nameAr: 'الجمرك وبحري والأنفوشي', lat: 31.2098, lng: 29.8825 },
        ],
      },
      {
        id: 'west-alex-agami',
        nameEn: 'West Alex, El Agami & Borg El Arab',
        nameAr: 'غرب الإسكندرية والعجمي والعامرية وبرج العرب',
        lat: 31.1482,
        lng: 29.8115,
        districts: [
          { id: 'karmouz-wardian', nameEn: 'Karmouz, Mina El Basal & Wardian', nameAr: 'كرموز ومينا البصل والورديان والقباري', lat: 31.1815, lng: 29.8921 },
          { id: 'dekheila-agami', nameEn: 'El Dekheila, Bitash & Hanoville (Agami)', nameAr: 'الدخيلة والبيطاش والهانوفيل (العجمي)', lat: 31.1062, lng: 29.7724 },
          { id: 'el-amriya', nameEn: 'El Amriya & King Mariout', nameAr: 'العامرية وكينج مريوط', lat: 31.0165, lng: 29.7962 },
          { id: 'borg-el-arab', nameEn: 'New Borg El Arab', nameAr: 'برج العرب الجديدة', lat: 30.8924, lng: 29.5742 },
        ],
      },
    ],
  },
  {
    id: 'qalyubia',
    nameEn: 'Qalyubia',
    nameAr: 'القليوبية',
    lat: 30.4069,
    lng: 31.1848,
    cities: [
      {
        id: 'banha',
        nameEn: 'Banha & Kafr Shukr',
        nameAr: 'بنها وكفر شكر',
        lat: 30.4659,
        lng: 31.1848,
        districts: [
          { id: 'banha-central', nameEn: 'Banha Central & Manshiya', nameAr: 'وسط بنها والمنشية', lat: 30.4659, lng: 31.1848 },
          { id: 'el-vilal', nameEn: 'Al Vilal & Ahram', nameAr: 'الفلل والأهرام', lat: 30.4611, lng: 31.1795 },
          { id: 'new-banha-kafr-shukr', nameEn: 'Benha El Gedida & Kafr Shukr', nameAr: 'بنها الجديدة وكفر شكر', lat: 30.5472, lng: 31.2615 },
        ],
      },
      {
        id: 'shubra-el-kheima',
        nameEn: 'Shubra El Kheima & Qalyub',
        nameAr: 'شبرا الخيمة وقليوب والقناطر الخيرية',
        lat: 30.1286,
        lng: 31.2422,
        districts: [
          { id: 'el-moassasa', nameEn: 'El Moassasa & Shubra El Kheima 1st', nameAr: 'المؤسسة وحي غرب شبرا', lat: 30.1304, lng: 31.2449 },
          { id: 'bahtim-mostorod', nameEn: 'Bahtim, Mostorod & East Shubra', nameAr: 'بهتيم ومسطرد وحي شرق شبرا', lat: 30.1452, lng: 31.2755 },
          { id: 'qalyub-qanater', nameEn: 'Qalyub & Al Qanater El Khayreya', nameAr: 'قليوب والقناطر الخيرية', lat: 30.1795, lng: 31.1852 },
        ],
      },
      {
        id: 'obour-city',
        nameEn: 'Obour, Khanka & Shibin El Qanater',
        nameAr: 'مدينة العبور والخانكة وشبين القناطر وطوخ',
        lat: 30.2054,
        lng: 31.4648,
        districts: [
          { id: 'obour-1st', nameEn: 'Obour Districts (1st - 9th) & New Obour', nameAr: 'أحياء العبور والعبور الجديدة', lat: 30.2082, lng: 31.4611 },
          { id: 'khanka-khosos', nameEn: 'El Khanka & El Khosos', nameAr: 'الخانكة والخصوص', lat: 30.2145, lng: 31.3665 },
          { id: 'toukh-qaha-shibin', nameEn: 'Toukh, Qaha & Shibin El Qanater', nameAr: 'طوخ وقها وشبين القناطر', lat: 30.3542, lng: 31.2015 },
        ],
      },
    ],
  },
  {
    id: 'sharqia',
    nameEn: 'Sharqia',
    nameAr: 'الشرقية',
    lat: 30.5877,
    lng: 31.502,
    cities: [
      {
        id: 'zagazig',
        nameEn: 'Zagazig',
        nameAr: 'الزقازيق',
        lat: 30.5877,
        lng: 31.502,
        districts: [
          { id: 'qawmia', nameEn: 'El Qawmia & University Area', nameAr: 'القومية ومنطقة الجامعة', lat: 30.5912, lng: 31.5065 },
          { id: 'el-montaza-zagazig', nameEn: 'El Montaza & Mahatta', nameAr: 'المنتزه والمحطة', lat: 30.5844, lng: 31.4955 },
          { id: 'el-hosseiniya-zagazig', nameEn: 'El Zohour & Nahas', nameAr: 'الزهور وحي أول وثان', lat: 30.5825, lng: 31.5142 },
        ],
      },
      {
        id: '10-ramadan',
        nameEn: '10th of Ramadan City',
        nameAr: 'العاشر من رمضان',
        lat: 30.3019,
        lng: 31.7418,
        districts: [
          { id: 'ardonia', nameEn: 'Al Ardonia & Neighborhoods', nameAr: 'الأردنية والمجاورات', lat: 30.2966, lng: 31.7422 },
          { id: '10-ramadan-industrial', nameEn: 'Industrial Zones & 1st-16th', nameAr: 'المناطق الصناعية والأحياء 1 إلى 16', lat: 30.3142, lng: 31.7595 },
        ],
      },
      {
        id: 'sharqia-centers',
        nameEn: 'Bilbeis, Minya El Qamh, Faqous & Abu Hammad',
        nameAr: 'بلبيس ومنيا القمح وفاقوس وأبو حماد والقرين',
        lat: 30.4202,
        lng: 31.5621,
        districts: [
          { id: 'bilbeis-mashtool', nameEn: 'Bilbeis & Mashtool El Souq', nameAr: 'بلبيس ومشتول السوق', lat: 30.4202, lng: 31.5621 },
          { id: 'minya-el-qamh', nameEn: 'Minya El Qamh & Hehya', nameAr: 'منيا القمح وههيا', lat: 30.5142, lng: 31.3485 },
          { id: 'faqous-abu-kabir', nameEn: 'Faqous, Abu Kabir & Al Salhiya', nameAr: 'فاقوس وأبو كبير والصالحية الجديدة', lat: 30.7285, lng: 31.7985 },
          { id: 'abu-hammad-hosseiniya', nameEn: 'Abu Hammad, Kafr Saqr & El Hosseiniya', nameAr: 'أبو حماد وكفر صقر والحسينية', lat: 30.5312, lng: 31.6685 },
        ],
      },
    ],
  },
  {
    id: 'dakahlia',
    nameEn: 'Dakahlia',
    nameAr: 'الدقهلية',
    lat: 31.0409,
    lng: 31.3785,
    cities: [
      {
        id: 'mansoura',
        nameEn: 'Mansoura & Talkha',
        nameAr: 'المنصورة وطلخا',
        lat: 31.0409,
        lng: 31.3785,
        districts: [
          { id: 'mashaya', nameEn: 'El Mashaya & Gehenna / University', nameAr: 'المشاية السفلية وشارع جيهان والجامعة', lat: 31.0442, lng: 31.3638 },
          { id: 'toriel', nameEn: 'Toriel & El Mokhtalat', nameAr: 'توريل والمختلط', lat: 31.0468, lng: 31.3895 },
          { id: 'talkha', nameEn: 'Talkha & Nabaroh', nameAr: 'طلخا ونبروه', lat: 31.0539, lng: 31.3778 },
          { id: 'qanat-el-suez-mansoura', nameEn: 'Qanat El Suez & Jedila', nameAr: 'قناة السويس وجديلة', lat: 31.0365, lng: 31.3942 },
        ],
      },
      {
        id: 'mit-ghamr',
        nameEn: 'Mit Ghamr, Aga & Sinbillawain',
        nameAr: 'ميت غمر وأجا والسنبلاوين',
        lat: 30.7167,
        lng: 31.2603,
        districts: [
          { id: 'mit-ghamr-central', nameEn: 'Mit Ghamr & Daqados', nameAr: 'وسط ميت غمر ودقادوس', lat: 30.7167, lng: 31.2603 },
          { id: 'aga-sinbillawain', nameEn: 'Aga & El Sinbillawain', nameAr: 'أجا والسنبلاوين', lat: 30.8812, lng: 31.4642 },
        ],
      },
      {
        id: 'north-dakahlia',
        nameEn: 'Dekernes, Manzala, Belqas & Gamasa',
        nameAr: 'دكرنس والمنزلة وبلقاس وجمصة وشربين',
        lat: 31.4325,
        lng: 31.5312,
        districts: [
          { id: 'belqas-gamasa', nameEn: 'Belqas, Gamasa & New Mansoura', nameAr: 'بلقاس وجمصة والمنصورة الجديدة', lat: 31.4385, lng: 31.5324 },
          { id: 'dekernes-shirbin', nameEn: 'Dekernes, Shirbin & Manzala', nameAr: 'دكرنس وشربين والمنزلة وميت سلسيل', lat: 31.0912, lng: 31.5945 },
        ],
      },
    ],
  },
  {
    id: 'gharbia',
    nameEn: 'Gharbia',
    nameAr: 'الغربية',
    lat: 30.7865,
    lng: 31.0004,
    cities: [
      {
        id: 'tanta',
        nameEn: 'Tanta',
        nameAr: 'طنطا',
        lat: 30.7865,
        lng: 31.0004,
        districts: [
          { id: 'el-bahr-st', nameEn: 'El Bahr St & Al Sayed El Badawi', nameAr: 'شارع البحر والسيد البدوي', lat: 30.7901, lng: 30.9998 },
          { id: 'stad-tanta', nameEn: 'Tanta Stadium & Al Helw', nameAr: 'منطقة الاستاد وشارع الحلو', lat: 30.8021, lng: 30.9965 },
          { id: 'seger-sabry', nameEn: 'Seger & Qahafa', nameAr: 'سيجر وقحافة', lat: 30.7812, lng: 31.0124 },
        ],
      },
      {
        id: 'mahalla',
        nameEn: 'El Mahalla El Kubra & Samanoud',
        nameAr: 'المحلة الكبرى وسمنود',
        lat: 30.9706,
        lng: 31.1669,
        districts: [
          { id: 'shoun', nameEn: 'El Shoun & Manshiya El Bakry', nameAr: 'الشون ومنشية البكري', lat: 30.9688, lng: 31.1635 },
          { id: 'samanoud-qotour', nameEn: 'Samanoud, Qotour & Zefta', nameAr: 'سمنود وقطور وزفتى والسنطة', lat: 30.9595, lng: 31.2395 },
          { id: 'kafr-el-zayat-basyoun', nameEn: 'Kafr El Zayat & Basyoun', nameAr: 'كفر الزيات وبسيون', lat: 30.8258, lng: 30.8185 },
        ],
      },
    ],
  },
  {
    id: 'monufia',
    nameEn: 'Monufia',
    nameAr: 'المنوفية',
    lat: 30.5586,
    lng: 31.0119,
    cities: [
      {
        id: 'shibin-el-kom',
        nameEn: 'Shibin El Kom & Delta Centers',
        nameAr: 'شبين الكوم ومراكز المنوفية',
        lat: 30.5586,
        lng: 31.0119,
        districts: [
          { id: 'shibin-central', nameEn: 'Shibin El Kom (Bar El Sharky & El Gharby)', nameAr: 'وسط شبين الكوم والبر الشرقي والغربي', lat: 30.5586, lng: 31.0119 },
          { id: 'ashmoun-menouf', nameEn: 'Ashmoun, Menouf & El Bagour', nameAr: 'أشمون ومنوف والباجور وسرس الليان', lat: 30.3012, lng: 30.9785 },
          { id: 'quesna-tala', nameEn: 'Quesna, Berket El Sabaa & Tala', nameAr: 'قويسنا وبركة السبع وتلا والشهداء', lat: 30.5642, lng: 31.1485 },
        ],
      },
      {
        id: 'sadat-city',
        nameEn: 'Sadat City',
        nameAr: 'مدينة السادات',
        lat: 30.3665,
        lng: 30.5146,
        districts: [
          { id: 'sadat-center', nameEn: 'Sadat City Residential Zones 1-25', nameAr: 'مناطق مدينة السادات السكنية والصناعية', lat: 30.3665, lng: 30.5146 },
        ],
      },
    ],
  },
  {
    id: 'beheira',
    nameEn: 'Beheira',
    nameAr: 'البحيرة',
    lat: 31.0377,
    lng: 30.4682,
    cities: [
      {
        id: 'damanhour',
        nameEn: 'Damanhour & Central Centers',
        nameAr: 'دمنهور ومراكز الوسط',
        lat: 31.0377,
        lng: 30.4682,
        districts: [
          { id: 'damanhour-central', nameEn: 'Damanhour Central & Al Saa Sq', nameAr: 'وسط دمنهور وميدان الساعة وأبو الريش', lat: 31.0377, lng: 30.4682 },
          { id: 'itay-shobrakheit', nameEn: 'Itay El Baroud, Shobrakheit & El Rahmaniya', nameAr: 'إيتاي البارود وشبراخيت والرحمانية', lat: 30.8855, lng: 30.6642 },
          { id: 'kom-hamada-badr', nameEn: 'Kom Hamada, Badr & Wadi El Natrun', nameAr: 'كوم حمادة وبدر ووادي النطرون والدلنجات', lat: 30.7615, lng: 30.6995 },
        ],
      },
      {
        id: 'kafr-el-dawar',
        nameEn: 'Kafr El Dawar, Rashid & Edko',
        nameAr: 'كفر الدوار ورشيد وإدكو وأبو المطامير',
        lat: 31.1319,
        lng: 30.1292,
        districts: [
          { id: 'kafr-el-dawar-central', nameEn: 'Kafr El Dawar & Abu Homs', nameAr: 'كفر الدوار وأبو حمص', lat: 31.1319, lng: 30.1292 },
          { id: 'rashid-edko', nameEn: 'Rashid, Edko & El Mahmoudiya', nameAr: 'رشيد وإدكو والمحمودية', lat: 31.4042, lng: 30.4175 },
          { id: 'abu-el-matamir', nameEn: 'Abu El Matamir & Housh Eissa', nameAr: 'أبو المطامير وحوش عيسى والنوبارية', lat: 30.9102, lng: 30.1745 },
        ],
      },
    ],
  },
  {
    id: 'kafr-el-sheikh',
    nameEn: 'Kafr El Sheikh',
    nameAr: 'كفر الشيخ',
    lat: 31.1107,
    lng: 30.9388,
    cities: [
      {
        id: 'kafr-el-sheikh-city',
        nameEn: 'Kafr El Sheikh City & East Centers',
        nameAr: 'مدينة كفر الشيخ والحامول وبيلا والبرلس',
        lat: 31.1107,
        lng: 30.9388,
        districts: [
          { id: 'kfs-central', nameEn: 'East & West Kafr El Sheikh', nameAr: 'شرق وغرب مدينة كفر الشيخ', lat: 31.1107, lng: 30.9388 },
          { id: 'biyla-hamoul', nameEn: 'Biyla, El Hamoul & El Riyad', nameAr: 'بيلا والحامول والرياض وسيدي غازي', lat: 31.1755, lng: 31.2198 },
          { id: 'baltim-borollos', nameEn: 'Baltim & Burullus Resort', nameAr: 'بلطيم ومصيف بلطيم والبرلس', lat: 31.5542, lng: 31.0935 },
        ],
      },
      {
        id: 'desouk',
        nameEn: 'Desouk, Fuwah, Metoubes & Qallin',
        nameAr: 'دسوق وفوة ومطوبس وقلين وسيدي سالم',
        lat: 31.1306,
        lng: 30.6461,
        districts: [
          { id: 'desouk-central', nameEn: 'Desouk Central & Al Ibrahim Mosque', nameAr: 'وسط دسوق والميدان الإبراهيمي', lat: 31.1306, lng: 30.6461 },
          { id: 'fuwah-metoubes', nameEn: 'Fuwah, Metoubes, Qallin & Sidi Salem', nameAr: 'فوة ومطوبس وقلين وسيدي سالم', lat: 31.2042, lng: 30.5495 },
        ],
      },
    ],
  },
  {
    id: 'damietta',
    nameEn: 'Damietta',
    nameAr: 'دمياط',
    lat: 31.4175,
    lng: 31.8144,
    cities: [
      {
        id: 'damietta-city',
        nameEn: 'Damietta City & Ras El Bar',
        nameAr: 'مدينة دمياط ورأس البر وعزبة البرج',
        lat: 31.4175,
        lng: 31.8144,
        districts: [
          { id: 'damietta-central', nameEn: 'Damietta Central & Shata', nameAr: 'وسط دمياط والأعصر وشطا', lat: 31.4175, lng: 31.8144 },
          { id: 'ras-el-bar', nameEn: 'Ras El Bar & Ezbet El Borg', nameAr: 'رأس البر وعزبة البرج', lat: 31.5142, lng: 31.8415 },
          { id: 'kafr-saad-fareskour', nameEn: 'Kafr Saad, Fareskour & El Zarqa', nameAr: 'كفر سعد وفارسكور والزرقا وكفر البطيخ', lat: 31.3512, lng: 31.6895 },
        ],
      },
      {
        id: 'new-damietta',
        nameEn: 'New Damietta',
        nameAr: 'دمياط الجديدة',
        lat: 31.4384,
        lng: 31.6744,
        districts: [
          { id: 'new-damietta-central', nameEn: 'Districts 1st - 5th & University', nameAr: 'الأحياء 1 إلى 5 والمنطقة المركزية', lat: 31.4384, lng: 31.6744 },
        ],
      },
    ],
  },
  {
    id: 'port-said',
    nameEn: 'Port Said',
    nameAr: 'بورسعيد',
    lat: 31.2653,
    lng: 32.3019,
    cities: [
      {
        id: 'port-said-east',
        nameEn: 'Port Said & Port Fouad Districts',
        nameAr: 'أحياء بورسعيد وبورفؤاد',
        lat: 31.2653,
        lng: 32.3019,
        districts: [
          { id: 'sharq', nameEn: 'Al Sharq & Al Arab', nameAr: 'حي الشرق وحي العرب', lat: 31.2661, lng: 32.3075 },
          { id: 'el-manakh-zohour', nameEn: 'Al Manakh, Al Zohour & Al Dawahy', nameAr: 'حي المناخ والزهور والضواحي', lat: 31.2635, lng: 32.2815 },
          { id: 'port-fouad', nameEn: 'Port Fouad & East Port Said', nameAr: 'بورفؤاد وشرق التفريعة', lat: 31.2462, lng: 32.3238 },
          { id: 'al-ganoub-gharbi', nameEn: 'Al Ganoub & Gharb', nameAr: 'حي الجنوب وحي غرب', lat: 31.1985, lng: 32.2485 },
        ],
      },
    ],
  },
  {
    id: 'ismailia',
    nameEn: 'Ismailia',
    nameAr: 'الإسماعيلية',
    lat: 30.5965,
    lng: 32.2715,
    cities: [
      {
        id: 'ismailia-city',
        nameEn: 'Ismailia City & Districts',
        nameAr: 'مدينة الإسماعيلية ومراكزها',
        lat: 30.5965,
        lng: 32.2715,
        districts: [
          { id: 'sheikh-zayed-ismailia', nameEn: '3rd District / Sheikh Zayed', nameAr: 'حي ثالث (الشيخ زايد)', lat: 30.6145, lng: 32.2738 },
          { id: 'al-sultan-hussein', nameEn: '1st & 2nd Districts (Sultan Hussein)', nameAr: 'حي أول وثان (السلطان حسين)', lat: 30.5931, lng: 32.2704 },
          { id: 'qantara-fayed', nameEn: 'El Qantara, Fayed & El Tal El Kebir', nameAr: 'القنطرة شرق وغرب وفايد والتل الكبير والقصاصين', lat: 30.3352, lng: 32.2975 },
        ],
      },
    ],
  },
  {
    id: 'suez',
    nameEn: 'Suez',
    nameAr: 'السويس',
    lat: 29.9668,
    lng: 32.5498,
    cities: [
      {
        id: 'suez-city',
        nameEn: 'Suez Districts & Ain Sokhna',
        nameAr: 'أحياء السويس والعين السخنة',
        lat: 29.9668,
        lng: 32.5498,
        districts: [
          { id: 'arbaeen', nameEn: 'El Arbaeen & Faisal', nameAr: 'حي الأربعين وحي فيصل', lat: 29.9722, lng: 32.5364 },
          { id: 'port-tawfiq', nameEn: 'El Suez & Port Tawfiq', nameAr: 'حي السويس وبورتوفيق', lat: 29.9516, lng: 32.5612 },
          { id: 'ataqa-ganayen', nameEn: 'Ataqa, El Ganayen & Ain Sokhna', nameAr: 'حي عتاقة والجناين والعين السخنة', lat: 29.6012, lng: 32.3168 },
        ],
      },
    ],
  },
  {
    id: 'north-sinai',
    nameEn: 'North Sinai',
    nameAr: 'شمال سيناء',
    lat: 31.1321,
    lng: 33.8033,
    cities: [
      {
        id: 'arish',
        nameEn: 'Al Arish, Sheikh Zuweid & Bir El Abd',
        nameAr: 'العريش والشيخ زويد وبئر العبد ورفح',
        lat: 31.1321,
        lng: 33.8033,
        districts: [
          { id: 'arish-central', nameEn: 'Al Arish Central & Al Reefay Square', nameAr: 'وسط العريش وميدان الرفاعي', lat: 31.1321, lng: 33.8033 },
          { id: 'el-masaied', nameEn: 'El Masaied & Riset El Arish', nameAr: 'المساعيد والريسة', lat: 31.1245, lng: 33.7602 },
          { id: 'bir-el-abd-rafah', nameEn: 'Bir El Abd, Sheikh Zuweid & Hasana', nameAr: 'بئر العبد والشيخ زويد والحسنة ونخل', lat: 31.0185, lng: 33.0124 },
        ],
      },
    ],
  },
  {
    id: 'south-sinai',
    nameEn: 'South Sinai',
    nameAr: 'جنوب سيناء',
    lat: 27.9158,
    lng: 34.3299,
    cities: [
      {
        id: 'sharm-el-sheikh',
        nameEn: 'Sharm El Sheikh & El Tor',
        nameAr: 'شرم الشيخ والطور',
        lat: 27.9158,
        lng: 34.3299,
        districts: [
          { id: 'naama-bay', nameEn: 'Naama Bay & Hadaba', nameAr: 'خليج نعمة والهضبة', lat: 27.9125, lng: 34.3283 },
          { id: 'soho-square', nameEn: 'Sharks Bay / SOHO & Nabq', nameAr: 'خليج القرش / سوهو ونبق', lat: 27.9628, lng: 34.3958 },
          { id: 'el-tor-city', nameEn: 'El Tor & Ras Sedr', nameAr: 'طور سيناء ورأس سدر وأبو رديس', lat: 28.2416, lng: 33.6222 },
        ],
      },
      {
        id: 'dahab',
        nameEn: 'Dahab, Nuweiba & Saint Catherine',
        nameAr: 'دهب ونويبع وطابا وسانت كاترين',
        lat: 28.5091,
        lng: 34.5136,
        districts: [
          { id: 'masbat', nameEn: 'El Masbat & Assalah', nameAr: 'المسبط والعصلة', lat: 28.5015, lng: 34.5162 },
          { id: 'nuweiba-taba-cat', nameEn: 'Nuweiba, Taba & Saint Catherine', nameAr: 'نويبع وطابا وسانت كاترين', lat: 29.0355, lng: 34.6642 },
        ],
      },
    ],
  },
  {
    id: 'beni-suef',
    nameEn: 'Beni Suef',
    nameAr: 'بني سويف',
    lat: 29.0661,
    lng: 31.0994,
    cities: [
      {
        id: 'beni-suef-city',
        nameEn: 'Beni Suef City & Centers',
        nameAr: 'مدينة بني سويف ومراكزها',
        lat: 29.0661,
        lng: 31.0994,
        districts: [
          { id: 'beni-suef-central', nameEn: 'Central Beni Suef & Moqbel', nameAr: 'وسط بني سويف ومقبل', lat: 29.0661, lng: 31.0994 },
          { id: 'new-beni-suef', nameEn: 'New Beni Suef (East Nile)', nameAr: 'بني سويف الجديدة (شرق النيل)', lat: 29.0414, lng: 31.1235 },
          { id: 'el-wasta-nasser-beba', nameEn: 'El Wasta, Nasser, Beba & Ehnasya', nameAr: 'الواسطى وناصر وببا وإهناسيا والفشن وسمسطا', lat: 29.3365, lng: 31.2055 },
        ],
      },
    ],
  },
  {
    id: 'fayoum',
    nameEn: 'Fayoum',
    nameAr: 'الفيوم',
    lat: 29.3084,
    lng: 30.8428,
    cities: [
      {
        id: 'fayoum-city',
        nameEn: 'Fayoum City & Centers',
        nameAr: 'مدينة الفيوم ومراكزها',
        lat: 29.3084,
        lng: 30.8428,
        districts: [
          { id: 'masalla', nameEn: 'Al Masalla & Keman Fares', nameAr: 'المسلة وكيمان فارس', lat: 29.3189, lng: 30.8482 },
          { id: 'fayoum-central', nameEn: 'Al Sawaqi & Lutfallah', nameAr: 'السواقي ولطف الله', lat: 29.3084, lng: 30.8428 },
          { id: 'new-fayoum-tamiya', nameEn: 'Tamiya, Sinnuris, Ibshway & Etsa', nameAr: 'طامية وسنورس وأبشواي وإطسا ويوسف الصديق', lat: 29.4065, lng: 30.8615 },
        ],
      },
    ],
  },
  {
    id: 'minya',
    nameEn: 'Minya',
    nameAr: 'المنيا',
    lat: 28.0871,
    lng: 30.7618,
    cities: [
      {
        id: 'minya-city',
        nameEn: 'Minya City & Centers',
        nameAr: 'مدينة المنيا ومراكزها',
        lat: 28.0871,
        lng: 30.7618,
        districts: [
          { id: 'minya-corniche', nameEn: 'Nile Corniche & Ard Sultan', nameAr: 'كورنيش النيل وأرض سلطان', lat: 28.0965, lng: 30.7582 },
          { id: 'new-minya', nameEn: 'New Minya & Damaris', nameAr: 'المنيا الجديدة ودماريس', lat: 28.0895, lng: 30.8185 },
          { id: 'malawi-samalut', nameEn: 'Malawi, Samalut, Beni Mazar & Maghagha', nameAr: 'ملوي وسمالوط وبني مزار ومغاغة وأبو قرقاص', lat: 27.7315, lng: 30.8415 },
        ],
      },
    ],
  },
  {
    id: 'assiut',
    nameEn: 'Assiut',
    nameAr: 'أسيوط',
    lat: 27.1783,
    lng: 31.1859,
    cities: [
      {
        id: 'assiut-city',
        nameEn: 'Assiut City & Centers',
        nameAr: 'مدينة أسيوط ومراكزها',
        lat: 27.1783,
        lng: 31.1859,
        districts: [
          { id: 'al-gomhouria', nameEn: 'Al Gomhouria, Al Nemis & East/West Assiut', nameAr: 'شارع الجمهورية والنمس وحي شرق وغرب أسيوط', lat: 27.1851, lng: 31.1889 },
          { id: 'new-assiut', nameEn: 'New Assiut City', nameAr: 'مدينة أسيوط الجديدة', lat: 27.2741, lng: 31.2815 },
          { id: 'manfalut-dairut-abu-tig', nameEn: 'Manfalut, Dairut, El Qusiya & Abu Tig', nameAr: 'منفلوط وديروط والقوصية وأبو تيج والبداري', lat: 27.3112, lng: 30.9715 },
        ],
      },
    ],
  },
  {
    id: 'sohag',
    nameEn: 'Sohag',
    nameAr: 'سوهاج',
    lat: 26.5591,
    lng: 31.6957,
    cities: [
      {
        id: 'sohag-city',
        nameEn: 'Sohag City & Centers',
        nameAr: 'مدينة سوهاج ومراكزها',
        lat: 26.5591,
        lng: 31.6957,
        districts: [
          { id: 'madinet-nasr-sohag', nameEn: 'Madinet Nasr, East & West Sohag', nameAr: 'مدينة ناصر وحي شرق وغرب سوهاج', lat: 26.5642, lng: 31.7012 },
          { id: 'akhmin', nameEn: 'Akhmim & New Sohag', nameAr: 'أخميم وسوهاج الجديدة والكوامل', lat: 26.5639, lng: 31.7453 },
          { id: 'girga-tahta-tama', nameEn: 'Girga, Tahta, Tama & El Balyana', nameAr: 'جرجا وطهطا وطما والبلينا والمراغة', lat: 26.3385, lng: 31.8912 },
        ],
      },
    ],
  },
  {
    id: 'qena',
    nameEn: 'Qena',
    nameAr: 'قنا',
    lat: 26.1551,
    lng: 32.716,
    cities: [
      {
        id: 'qena-city',
        nameEn: 'Qena City, Qus & New Qena',
        nameAr: 'مدينة قنا وقوص وقفط ونقادة',
        lat: 26.1551,
        lng: 32.716,
        districts: [
          { id: 'qena-central', nameEn: 'Qena Central, Al Saa & New Qena', nameAr: 'وسط قنا وميدان الساعة وقنا الجديدة', lat: 26.1551, lng: 32.716 },
          { id: 'qus-qift-naqada', nameEn: 'Qus, Qift & Naqada', nameAr: 'قوص وقفط ونقادة', lat: 25.9142, lng: 32.7625 },
        ],
      },
      {
        id: 'nag-hammadi',
        nameEn: 'Nag Hammadi, Deshna & Farshut',
        nameAr: 'نجع حمادي ودشنا وفرشوط وأبو تشت',
        lat: 26.0484,
        lng: 32.2414,
        districts: [
          { id: 'nag-hammadi-central', nameEn: 'Nag Hammadi, Deshna, Farshut & Abu Tesht', nameAr: 'نجع حمادي ودشنا وفرشوط وأبو تشت', lat: 26.0484, lng: 32.2414 },
        ],
      },
    ],
  },
  {
    id: 'luxor',
    nameEn: 'Luxor',
    nameAr: 'الأقصر',
    lat: 25.6872,
    lng: 32.6396,
    cities: [
      {
        id: 'luxor-city',
        nameEn: 'Luxor City & Centers',
        nameAr: 'مدينة الأقصر ومراكزها',
        lat: 25.6872,
        lng: 32.6396,
        districts: [
          { id: 'luxor-east', nameEn: 'East Bank, Karnak & Awameya', nameAr: 'البر الشرقي والكرنك والعوامية', lat: 25.7021, lng: 32.6484 },
          { id: 'luxor-west', nameEn: 'West Bank & Al Qurna', nameAr: 'البر الغربي والقرنة', lat: 25.7188, lng: 32.6012 },
          { id: 'esna-armant-new-tiba', nameEn: 'Esna, Armant, Bayadiya & New Tiba', nameAr: 'إسنا وأرمنت والبياضية وطيبة الجديدة', lat: 25.2912, lng: 32.5535 },
        ],
      },
    ],
  },
  {
    id: 'aswan',
    nameEn: 'Aswan',
    nameAr: 'أسوان',
    lat: 24.0889,
    lng: 32.8998,
    cities: [
      {
        id: 'aswan-city',
        nameEn: 'Aswan City & Centers',
        nameAr: 'مدينة أسوان ومراكزها',
        lat: 24.0889,
        lng: 32.8998,
        districts: [
          { id: 'aswan-corniche', nameEn: 'Aswan Corniche, Al Aqqad & Al Sadaqa', nameAr: 'كورنيش أسوان والعقاد والصداقة', lat: 24.0928, lng: 32.8973 },
          { id: 'aswan-new', nameEn: 'New Aswan & Gharb Suhail', nameAr: 'أسوان الجديدة وغرب سهيل', lat: 24.1615, lng: 32.8521 },
          { id: 'kom-ombo-edfu-abu-simbel', nameEn: 'Kom Ombo, Edfu, Daraw & Abu Simbel', nameAr: 'كوم أمبو وإدفو ودراو ونصر النوبة وأبو سمبل', lat: 24.4765, lng: 32.9485 },
        ],
      },
    ],
  },
  {
    id: 'red-sea',
    nameEn: 'Red Sea',
    nameAr: 'البحر الأحمر',
    lat: 27.2579,
    lng: 33.8116,
    cities: [
      {
        id: 'hurghada',
        nameEn: 'Hurghada, Ras Gharib & Safaga',
        nameAr: 'الغردقة ورأس غارب وسفاجا',
        lat: 27.2579,
        lng: 33.8116,
        districts: [
          { id: 'al-dahar', nameEn: 'Al Dahar & Al Ahyaa', nameAr: 'الدهار والأحياء', lat: 27.2579, lng: 33.8116 },
          { id: 'el-mamsha', nameEn: 'El Mamsha, Sheraton & Sahl Hasheesh', nameAr: 'الممشى السياحي وشيراتون وسهل حشيش', lat: 27.1945, lng: 33.8355 },
          { id: 'el-gouna', nameEn: 'El Gouna', nameAr: 'الجونة', lat: 27.3942, lng: 33.6782 },
          { id: 'ras-gharib-safaga', nameEn: 'Ras Gharib & Safaga', nameAr: 'رأس غارب وسفاجا', lat: 26.7495, lng: 33.9362 },
        ],
      },
      {
        id: 'marsa-alam',
        nameEn: 'Marsa Alam, El Qoseir & Shalateen',
        nameAr: 'مرسى علم والقصير والشلاتين وحلايب',
        lat: 25.0676,
        lng: 34.879,
        districts: [
          { id: 'marsa-alam-central', nameEn: 'Marsa Alam, El Qoseir & Port Ghalib', nameAr: 'مرسى علم والقصير وبورت غالب والشلاتين', lat: 25.0676, lng: 34.879 },
        ],
      },
    ],
  },
  {
    id: 'new-valley',
    nameEn: 'New Valley',
    nameAr: 'الوادي الجديد',
    lat: 25.439,
    lng: 30.5586,
    cities: [
      {
        id: 'kharga',
        nameEn: 'Al Kharga & Baris',
        nameAr: 'الخارجة وباريس',
        lat: 25.439,
        lng: 30.5586,
        districts: [
          { id: 'kharga-central', nameEn: 'Al Kharga Central & Baris Oasis', nameAr: 'وسط الخارجة وباريس', lat: 25.439, lng: 30.5586 },
        ],
      },
      {
        id: 'dakhla',
        nameEn: 'Al Dakhla, Farafra & Balat',
        nameAr: 'الداخلة والفرافرة وبلاط',
        lat: 25.495,
        lng: 28.9833,
        districts: [
          { id: 'mut', nameEn: 'Mut, Balat & Al Farafra', nameAr: 'موط وبلاط والفرافرة', lat: 25.495, lng: 28.9833 },
        ],
      },
    ],
  },
  {
    id: 'matrouh',
    nameEn: 'Matrouh',
    nameAr: 'مطروح',
    lat: 31.3543,
    lng: 27.2373,
    cities: [
      {
        id: 'marsa-matrouh',
        nameEn: 'Marsa Matrouh, Siwa & West Coast',
        nameAr: 'مرسى مطروح وسيوة والحمام والسلوم',
        lat: 31.3543,
        lng: 27.2373,
        districts: [
          { id: 'alexandria-st-matrouh', nameEn: 'Alexandria St, Corniche & Rommel', nameAr: 'شارع الإسكندرية والكورنيش وعلم الروم', lat: 31.3543, lng: 27.2373 },
          { id: 'siwa-barani-saloum', nameEn: 'Siwa Oasis, Sidi Barrani & El Negaila', nameAr: 'واحة سيوة وسيدي براني والنجيلة والسلوم', lat: 29.2032, lng: 25.5196 },
        ],
      },
      {
        id: 'al-alamein',
        nameEn: 'New Alamein, El Dabaa & El Hammam',
        nameAr: 'العلمين الجديدة والضبعة والحمام والساحل الشمالي',
        lat: 30.8384,
        lng: 28.9522,
        districts: [
          { id: 'marina-alamein', nameEn: 'Marina, New Alamein, Hacienda & Sidi Abdel Rahman', nameAr: 'مارينا والعلمين الجديدة وسيدي عبد الرحمن', lat: 30.8384, lng: 28.9522 },
          { id: 'hammam-dabaa', nameEn: 'El Hammam & El Dabaa', nameAr: 'الحمام والضبعة', lat: 30.8425, lng: 29.3895 },
        ],
      },
    ],
  },
];

export interface ItemCategoryOption {
  id: string;
  nameEn: string;
  nameAr: string;
  isSensitiveDocument?: boolean;
}

export const ITEM_CATEGORIES: ItemCategoryOption[] = [
  { id: 'electronics', nameEn: 'Electronics & Phones', nameAr: 'إلكترونيات وهواتف' },
  { id: 'wallets-bags', nameEn: 'Wallets & Bags', nameAr: 'محافظ وحقائب' },
  { id: 'keys', nameEn: 'Keys & Car Fobs', nameAr: 'مفاتيح وريموت سيارات' },
  { id: 'documents', nameEn: 'Official Documents & Cards', nameAr: 'مستندات رسمية وبطاقات', isSensitiveDocument: true },
  { id: 'eyewear', nameEn: 'Eyewear & Sunglasses', nameAr: 'نظارات شمسية وطبية' },
  { id: 'jewelry', nameEn: 'Watches & Jewelry', nameAr: 'ساعات ومجوهرات' },
  { id: 'clothing', nameEn: 'Clothing & Accessories', nameAr: 'ملابس وإكسسوارات' },
  { id: 'pets', nameEn: 'Pets', nameAr: 'حيوانات أليفة' },
  { id: 'academic', nameEn: 'Books & University Items', nameAr: 'كتب ومستلزمات جامعية' },
  { id: 'other', nameEn: 'Other Personal Items', nameAr: 'متعلقات شخصية أخرى' },
];

export interface ItemColorOption {
  id: string;
  nameEn: string;
  nameAr: string;
  hex: string;
}

export const ITEM_COLORS: ItemColorOption[] = [
  { id: 'black', nameEn: 'Black', nameAr: 'أسود', hex: '#0F172A' },
  { id: 'navy', nameEn: 'Navy / Blue', nameAr: 'كحلي / أزرق', hex: '#1D4ED8' },
  { id: 'red', nameEn: 'Red', nameAr: 'أحمر', hex: '#DC2626' },
  { id: 'green', nameEn: 'Green', nameAr: 'أخضر', hex: '#16A34A' },
  { id: 'amber', nameEn: 'Gold / Brown', nameAr: 'ذهبي / بني', hex: '#B45309' },
  { id: 'silver', nameEn: 'Silver / Gray', nameAr: 'فضي / رمادي', hex: '#64748B' },
  { id: 'white', nameEn: 'White', nameAr: 'أبيض', hex: '#F8FAFC' },
  { id: 'violet', nameEn: 'Purple', nameAr: 'بنفسجي', hex: '#6D28D9' },
];

export function findGovernorate(id: string): GovernorateEntry | undefined {
  return EGYPT_GOVERNORATES.find((g) => g.id === id);
}

export function findCity(governorateId: string, cityId: string): CityEntry | undefined {
  return findGovernorate(governorateId)?.cities.find((c) => c.id === cityId);
}

export function findDistrict(
  governorateId: string,
  cityId: string,
  districtId: string
): DistrictEntry | undefined {
  return findCity(governorateId, cityId)?.districts.find((d) => d.id === districtId);
}

/**
 * Computes Haversine distance in kilometers between two coordinates.
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Applies public location privacy obfuscation (~1.4km grid snap)
 * so exact home addresses or high-value found spots are never exposed publicly.
 */
export function applyLocationPrivacy(
  lat: number,
  lng: number,
  privacy: 'exact' | 'approximate'
): { lat: number; lng: number; isApproximate: boolean } {
  if (privacy === 'exact') {
    return {
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      isApproximate: false,
    };
  }
  const gridStep = 0.015; // ~1.5km public privacy cell
  return {
    lat: Math.round((Math.round(lat / gridStep) * gridStep + 0.003) * 10000) / 10000,
    lng: Math.round((Math.round(lng / gridStep) * gridStep + 0.003) * 10000) / 10000,
    isApproximate: true,
  };
}
