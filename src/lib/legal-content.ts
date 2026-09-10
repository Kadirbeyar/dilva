/**
 * Terms of Service + Privacy Policy content, kept as plain data here
 * instead of the next-intl messages/*.json files: legal text is long,
 * changes independently of UI copy, and reads better maintained as
 * whole documents per locale than split across hundreds of small
 * translation keys.
 *
 * IMPORTANT — this is a solid starting template written to reflect
 * what Dilva actually does (location fuzzing, manual + Stripe
 * payments, chat/photo storage, age minimum, reporting), not a
 * substitute for review by a real lawyer in the country Dilva is
 * legally operated from. Update CONTACT_EMAIL below if support should
 * go somewhere other than the developer's own inbox.
 */

export const CONTACT_EMAIL = "qader.doski41@gmail.com";

export type LegalDoc = {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
};

type Locale = "ku" | "ckb" | "ar" | "tr" | "en";

const LAST_UPDATED: Record<Locale, string> = {
  ku: "٩ی ئەیلولا ٢٠٢٦",
  ckb: "٩ی ئەیلوولی ٢٠٢٦",
  ar: "9 سبتمبر 2026",
  tr: "9 Eylül 2026",
  en: "September 9, 2026",
};

export const TERMS: Record<Locale, LegalDoc> = {
  en: {
    title: "Terms of Service",
    updated: LAST_UPDATED.en,
    sections: [
      {
        heading: "1. Acceptance",
        body: [
          "By creating an account or using Dilva (\"the app\", \"we\", \"our\"), you agree to these Terms of Service. If you do not agree, please do not use Dilva.",
        ],
      },
      {
        heading: "2. Who can use Dilva",
        body: [
          "You must be at least 16 years old to create an account. By signing up, you confirm that the birth date you provide is accurate.",
          "You must provide a working email address and keep your account credentials confidential. You are responsible for all activity under your account.",
        ],
      },
      {
        heading: "3. What Dilva is for",
        body: [
          "Dilva connects language learners with native speakers to chat, post short updates for correction, and find nearby language partners. It is a social and educational tool, not a dating service, translation-for-hire service, or professional tutoring platform, although members may use it however they find helpful within these Terms.",
        ],
      },
      {
        heading: "4. Your content",
        body: [
          "You keep ownership of the posts, messages, photos, and profile information you upload (\"your content\"). By posting it on Dilva, you grant us a limited license to store, display, and transmit it as needed to operate the app (for example, showing your posts to other users, or delivering your chat messages to the recipient).",
          "You are solely responsible for your content. Do not post anything illegal, harassing, hateful, sexually explicit involving minors (which is always prohibited, without exception), or that infringes someone else's rights.",
        ],
      },
      {
        heading: "5. Community conduct",
        body: [
          "Be respectful. Do not harass, threaten, impersonate, or scam other users. Do not use Dilva to advertise unrelated products or services, or to create fake/bot accounts intended to deceive real members.",
          "Users can report posts, messages, or profiles that break these rules. We may review reports and remove content or suspend/terminate accounts that violate these Terms, at our discretion.",
        ],
      },
      {
        heading: "6. Location features",
        body: [
          "Dilva's \"Nearby\" map is opt-in: your exact coordinates are never shown to other users. Locations shown on the map are randomly offset by up to roughly 1.5 km, and the map cannot be zoomed in past a fixed level, specifically so no one can be pinpointed to a home address. You can turn your visibility on or off at any time from the Nearby page.",
          "Viewing the Nearby map itself is a Premium feature; being discoverable to Premium viewers is free and requires your explicit opt-in.",
        ],
      },
      {
        heading: "7. Payments and subscriptions (Premium)",
        body: [
          "Dilva Premium is a paid subscription unlocking extra features (such as the Nearby map, profile visitors, and search filters). Prices and durations are shown before you pay.",
          "Payment can be made either through Stripe (card payment) or through a manual payment method (bank/Qi Card transfer or cryptocurrency) that we review and approve by hand. Manual payments are not instant: your Premium access begins once we confirm the payment was received, and we may reject a manual payment claim that we cannot verify.",
          "Subscriptions do not auto-renew unless explicitly stated at checkout. We do not store your card details ourselves — card payments are processed entirely by Stripe.",
          "Because manual payments involve real bank/crypto transfers outside of Stripe's buyer protections, please only send payment for the plan and amount actually shown in the app, and keep your own transfer receipt in case of a dispute.",
        ],
      },
      {
        heading: "8. Termination",
        body: [
          "You may stop using Dilva and request account deletion at any time by contacting us. We may suspend or terminate accounts that violate these Terms, attempt to abuse the platform (including automated bot activity not authorized by us), or pose a risk to other users.",
        ],
      },
      {
        heading: "9. Disclaimers",
        body: [
          "Dilva is provided \"as is\". We do not guarantee that any specific match, correction, or conversation will occur, or that the service will be uninterrupted or error-free. You are responsible for your own safety when meeting or communicating with people you find through Dilva — never share financial information with someone you met on the app, and meet new people in public places.",
        ],
      },
      {
        heading: "10. Changes to these Terms",
        body: [
          "We may update these Terms as Dilva grows. If we make a material change, we will update the \"last updated\" date above. Continuing to use Dilva after a change means you accept the updated Terms.",
        ],
      },
      {
        heading: "11. Contact",
        body: [`Questions about these Terms can be sent to ${CONTACT_EMAIL}.`],
      },
    ],
  },
  tr: {
    title: "Kullanım Koşulları",
    updated: LAST_UPDATED.tr,
    sections: [
      {
        heading: "1. Kabul",
        body: [
          "Bir hesap oluşturarak veya Dilva'yı (\"uygulama\", \"biz\") kullanarak bu Kullanım Koşulları'nı kabul etmiş olursunuz. Kabul etmiyorsanız lütfen Dilva'yı kullanmayın.",
        ],
      },
      {
        heading: "2. Kimler kullanabilir",
        body: [
          "Hesap oluşturmak için en az 16 yaşında olmalısınız. Kayıt olarak, verdiğiniz doğum tarihinin doğru olduğunu onaylarsınız.",
          "Geçerli bir e-posta adresi vermeli ve hesap bilgilerinizi gizli tutmalısınız. Hesabınız altındaki tüm etkinlikten siz sorumlusunuz.",
        ],
      },
      {
        heading: "3. Dilva ne için kullanılır",
        body: [
          "Dilva, dil öğrenenleri anadili konuşanlarla buluşturarak sohbet etmelerini, düzeltme için kısa gönderiler paylaşmalarını ve yakındaki dil partnerlerini bulmalarını sağlar. Bu Koşullar çerçevesinde üyeler istedikleri gibi kullanabilse de, Dilva bir flört, ücretli çeviri veya profesyonel özel ders platformu değildir.",
        ],
      },
      {
        heading: "4. İçeriğiniz",
        body: [
          "Yüklediğiniz gönderiler, mesajlar, fotoğraflar ve profil bilgileri (\"içeriğiniz\") size aittir. Bunları Dilva'ya yükleyerek, uygulamayı çalıştırmak için gerekli ölçüde (örneğin gönderilerinizi diğer kullanıcılara göstermek veya mesajlarınızı alıcıya iletmek gibi) saklama, gösterme ve iletme hakkını bize verirsiniz.",
          "İçeriğinizden yalnızca siz sorumlusunuz. Yasa dışı, taciz edici, nefret söylemi içeren, reşit olmayanlarla ilgili cinsel içerik (bu kesinlikle ve istisnasız yasaktır) veya başkasının haklarını ihlal eden hiçbir şey paylaşmayın.",
        ],
      },
      {
        heading: "5. Topluluk davranış kuralları",
        body: [
          "Saygılı olun. Diğer kullanıcıları taciz etmeyin, tehdit etmeyin, taklit etmeyin veya dolandırmayın. Dilva'yı ilgisiz ürün/hizmet reklamı için veya gerçek üyeleri kandırmaya yönelik sahte/bot hesaplar oluşturmak için kullanmayın.",
          "Kullanıcılar bu kuralları ihlal eden gönderi, mesaj veya profilleri şikayet edebilir. Şikayetleri inceleyip, takdirimize bağlı olarak bu Koşulları ihlal eden içerikleri kaldırabilir veya hesapları askıya alabilir/kapatabiliriz.",
        ],
      },
      {
        heading: "6. Konum özellikleri",
        body: [
          "Dilva'nın \"Yakınımdakiler\" haritası isteğe bağlıdır: tam konumunuz asla diğer kullanıcılara gösterilmez. Haritada gösterilen konumlar rastgele olarak yaklaşık 1,5 km'ye kadar kaydırılır ve harita, kimsenin bir ev adresine kadar takip edilememesi için belirli bir seviyenin ötesine yakınlaştırılamaz. Görünürlüğünüzü Yakınımdakiler sayfasından istediğiniz zaman açıp kapatabilirsiniz.",
          "Yakınımdakiler haritasını görüntülemek Premium özelliğidir; Premium kullanıcılara görünür olmak ise ücretsizdir ve açık onayınızı gerektirir.",
        ],
      },
      {
        heading: "7. Ödemeler ve abonelikler (Premium)",
        body: [
          "Dilva Premium, ek özelliklerin (Yakınımdakiler haritası, profil ziyaretçileri, arama filtreleri gibi) kilidini açan ücretli bir abonelik hizmetidir. Fiyatlar ve süreler ödeme öncesi gösterilir.",
          "Ödeme, Stripe (kart ile) veya elle incelediğimiz ve onayladığımız manuel bir yöntemle (banka/Qi Card havalesi veya kripto para) yapılabilir. Manuel ödemeler anlık değildir: Premium erişiminiz, ödemenin alındığını doğruladığımızda başlar; doğrulayamadığımız bir manuel ödeme talebini reddedebiliriz.",
          "Ödeme sırasında açıkça belirtilmedikçe abonelikler otomatik yenilenmez. Kart bilgilerinizi biz saklamayız — kart ödemeleri tamamen Stripe tarafından işlenir.",
          "Manuel ödemeler Stripe'ın alıcı korumaları dışında gerçek banka/kripto transferleri içerdiğinden, lütfen yalnızca uygulamada gösterilen plan ve tutar için ödeme gönderin ve olası bir anlaşmazlık için kendi transfer makbuzunuzu saklayın.",
        ],
      },
      {
        heading: "8. Fesih",
        body: [
          "Dilva'yı kullanmayı istediğiniz zaman durdurabilir ve bize ulaşarak hesap silinmesi talep edebilirsiniz. Bu Koşulları ihlal eden, platformu kötüye kullanmaya çalışan (bizim izin vermediğimiz otomatik bot etkinliği dahil) veya diğer kullanıcılar için risk oluşturan hesapları askıya alabilir veya kapatabiliriz.",
        ],
      },
      {
        heading: "9. Sorumluluk reddi",
        body: [
          "Dilva \"olduğu gibi\" sunulur. Belirli bir eşleşmenin, düzeltmenin veya sohbetin gerçekleşeceğini ya da hizmetin kesintisiz veya hatasız olacağını garanti etmeyiz. Dilva üzerinden tanıştığınız kişilerle görüşürken veya iletişim kurarken kendi güvenliğinizden siz sorumlusunuz — uygulamada tanıştığınız biriyle asla finansal bilgi paylaşmayın ve yeni insanlarla halka açık yerlerde buluşun.",
        ],
      },
      {
        heading: "10. Bu Koşullardaki değişiklikler",
        body: [
          "Dilva büyüdükçe bu Koşulları güncelleyebiliriz. Önemli bir değişiklik yaparsak yukarıdaki \"son güncelleme\" tarihini güncelleriz. Bir değişiklikten sonra Dilva'yı kullanmaya devam etmeniz, güncellenmiş Koşulları kabul ettiğiniz anlamına gelir.",
        ],
      },
      {
        heading: "11. İletişim",
        body: [`Bu Koşullarla ilgili sorularınızı ${CONTACT_EMAIL} adresine gönderebilirsiniz.`],
      },
    ],
  },
  ku: {
    title: "مەرجێن بکارئینانێ",
    updated: LAST_UPDATED.ku,
    sections: [
      {
        heading: "١. پەسەندکرن",
        body: [
          "دەمێ تو حسابەکێ چێدکەی یان Dilva (\"appê\"، \"ئەم\") بکاردئنی، تو ڤان مەرجێن بکارئنانێ پەسەند دکەی. ئەگەر تو پەسەند نەکەی، ژکەرەم فەزلێن Dilva بکار نەئینه.",
        ],
      },
      {
        heading: "٢. کێ دشێت بکاربئنیت",
        body: [
          "پێدڤیه تو لایا کێمتر ١٦ سالان بی دا حسابەکێ چێبکەی. ب خۆتومارکرنێ، تو پشتراست دکەی کو دیرۆکا ژدایکبوونێ یا تە دانیوه راستە.",
          "پێدڤیه ئیمەیلەکا کاردار بدەی و زانیارییێن حسابێ تە یێن شیفرەیی نهێنی بمینن. تو بەرپرسیارێ هەمی چالاکییا ژێر ناڤێ حسابێ خۆ ی.",
        ],
      },
      {
        heading: "٣. Dilva بو چیه",
        body: [
          "Dilva فێرخوازێن زمانان دگەهینیته کەسێن خودان زمانێ دایکی، دا پێکڤه بئخڤن، پۆستێن کورت بو ڕاستکرنێ بلاڤ بکەن، و هاڤاڵێن زمانی یێن نزیک بدۆزنەڤه. ئەڤە appەکا کۆمەلایەتی و پەروەردەیی یه، نەک appەکا هاڤاڵگیریێ، وەرگێڕانا ب کرێ، یان platformا وانەدانا پیشەیی — هەرچەندە ئەندام دشێن ب هەر شێوەیێ سودمەند د چوارچێوا ڤان مەرجان دا بکاربئنن.",
        ],
      },
      {
        heading: "٤. ناڤەرۆکا تە",
        body: [
          "پۆست، پەیام، وئنه و زانیارییێن profilی یێن تو بار دکەی (\"ناڤەرۆکا تە\") یا تە دمینیت. ب بارکرنا وان ل سەر Dilva، تو مۆڵەتەکا سنووردار ددەیه مه دا وان بپاریزین، پیشان بدەین و بگەهینین، بو ئەوێ appê ب شێوەیەکێ راست کار بکەت (بو نموونه، پۆستێن تە بو کاربەرێن دی پیشان بدەین، یان پەیامێن تە بگەهینین وەرگرێ).",
          "تو ب تنێ بەرپرسیارێ ناڤەرۆکا خۆ ی. تشتەکێ نەیاسایی، ئازاردار، ب رق و کینه، ناڤەرۆکا سێکسی یا پەیوەندیدار ب زاروکان (ئەڤە بێ ئیستیسنا هەر دەم قەدەغەیه)، یان تشتەکێ ماف و مۆڵەتێن کەسەکێ دی بشکینیت، بار نەکه.",
        ],
      },
      {
        heading: "٥. رەفتارا کۆمەلگەهێ",
        body: [
          "رێزدار به. کاربەرێن دی ئازار نەده، تەهدید نەکه، خۆ وەکی کەسەکێ دی نیشان نەده، یان فێڵ لێ نەکه. Dilva بو رێکلامکرنا بەرهەم/خزمەتگوزارییێن نامرتبط، یان چێکرنا حسابێن ساخته/بۆت یێن بو خاپاندنا ئەندامێن راستەقینه، بکار نەئینه.",
          "کاربەر دشێن پۆست، پەیام یان profilێن ڤان یاسایان دشکینن، ڕاپۆرت بکەن. ئەم دشێین ڕاپۆرتان بپشکنین و، ب گوهرا بریارا خۆ، ناڤەرۆکا خەلەت ڕابکەین یان حسابێن ڤان مەرجان دشکینن ڕاوەستینین/بگرین.",
        ],
      },
      {
        heading: "٦. تایبەتمەندییێن جهێ (Location)",
        body: [
          "نەخشەیا \"نزیکی من\" یا Dilva ب خۆویستنه: جهێ تە یێ راستەقینه چو کات نایێته پیشاندان بو کاربەرێن دی. جهێن ل سەر نەخشێ پیشاندراین ب شێوەیەکێ هەرەمیکی هەتا نزیکی ١.٥ کم دهێنه گوهرین، و نەخشه ناشێت ژ ئاستەکێ دیاریکری زیاتر زووم ببیت — تایبەتی دا کەس نەشێت بگەهیته ناڤ و ناونیشانا ماله. تو دشێی دیارتیبوونا خۆ هەر دەم ژ لاپەرا نزیکی من ڤەکەی یان دابخی.",
          "دیتنا نەخشێ خۆ Premiumه؛ بەلێ دیارببوون بو بکارهئنەرێن Premium ب خۆرایی یه و پێدڤیه ب خۆویستنا ئاشکرا یا تە هەیه.",
        ],
      },
      {
        heading: "٧. پارەدان و ئابونمان (Premium)",
        body: [
          "Dilva Premium ئابونمانەکا پارەیی یه یا فەزلێن زێدە (وەکی نەخشا نزیکی من، سەردانکەرێن profilی، و فلتەرێن گەڕیانێ) ڤەدکەت. نرخ و ماوه بەری پارەدانێ دهێنه پیشاندان.",
          "پارەدان دشێت ب رێکا Stripe (کارت) یان رێکەکا دەستی (گواستنا بانکی/Qi Card یان کریپتۆ) ب کارببیت، یا ئەم ب دەست دپشکینین و پەسەند دکەین. پارەدانا دەستی نه دەمژمێری یه: دەستپێکا Premium یا تە دەمێ ئەم پشتراستی ژ وەرگرتنا پارەیێ دبین، دئ دەستپێکیت؛ داواکارییەکا پارەدانا دەستی یا ئەم نەشێین پشتراست بکەین، دشێین ڕاب بکەین.",
          "ئابونمان خۆبخۆ نویی نابن مەگەر دیاردەرێ بەرچاڤ بو وی هەبیت. ئەم زانیارییێن کارتێ تە پارێزناکەین — پارەدانا کارتێ ب تەمامی ژلایێ Stripe ڤە دهێته کرن.",
          "ژبەرکو پارەدانا دەستی گواستنا راستەقینه یا بانکی/کریپتۆیه یا دەرڤەی پاراستنا کڕیارێن Stripe، تکایه ب تنێ بو پلان و بڕا دیاریکری یا appê دا نیشان دهێته پارە بنێره، و وەسیقا گواستنا خۆ بو ھەر ناکۆکییەکا پێشوازی بپارێزه.",
        ],
      },
      {
        heading: "٨. ڕاوەستاندن",
        body: [
          "تو دشێی بکارئنانا Dilva هەر دەم ڕاوەستینی و داخازا سڕینا حسابێ خۆ ژمە بکەی. ئەم دشێین حسابێن ڤان مەرجان دشکینن، هەول ددەن platformê بکار خەلەت بئینن (تەنانەت چالاکییا bot یا ئۆتۆماتیکی یا ب مۆڵەتا مه نینه)، یان مەترسییێ بو کاربەرێن دی چێدکەن، ڕاوەستینین یان بگرین.",
        ],
      },
      {
        heading: "٩. ڕەتکرنا بەرپرسیارییێ",
        body: [
          "Dilva وەکی \"ئەوجارا هەیه\" پێشکێش دبیت. ئەم پشتگیری ناکەین کو هاوتاکرن، ڕاستکرن یان ئاخفتنەکا دیاریکری دئ رویبدەت، یان خزمەتگوزاری بێ ڕاوەستان و خەلەتی دئ بیت. تو ب خۆ بەرپرسیارێ سلامەتییا خۆ ی دگەل کەسێن ژ ڕێکا Dilva دناسی — چو کات زانیارییێن دارایی دگەل کەسەکێ ل appê ناسیایی نەکه، و دگەل کەسێن نوو ل جهێن گشتی ببینه.",
        ],
      },
      {
        heading: "١٠. گوهرینا ڤان مەرجان",
        body: [
          "دگەل مەزنبوونا Dilva، ئەم دشێین ڤان مەرجان نویکەین. ئەگەر گوهرینەکا گرنگ چێبکەین، دیرۆکا \"دویماهیک نویکری\" یا سەرو دئ نویکەین. بەردەوامبوونا بکارئنانا Dilva پشتی گوهرینەکێ، بمانایا پەسەندکرنا مەرجێن نویکری یه.",
        ],
      },
      {
        heading: "١١. پەیوەندی",
        body: [`پرسیارێن دەربارەی ڤان مەرجان دشێن بو ${CONTACT_EMAIL} بهێنه نڤیسین.`],
      },
    ],
  },
  ar: {
    title: "شروط الخدمة",
    updated: LAST_UPDATED.ar,
    sections: [
      {
        heading: "1. القبول",
        body: [
          "بإنشاء حساب أو استخدام Dilva (\"التطبيق\"، \"نحن\")، فإنك توافق على شروط الخدمة هذه. إذا كنت لا توافق، يرجى عدم استخدام Dilva.",
        ],
      },
      {
        heading: "2. من يمكنه استخدام Dilva",
        body: [
          "يجب أن يكون عمرك 16 عاماً على الأقل لإنشاء حساب. بالتسجيل، فإنك تؤكد أن تاريخ الميلاد الذي تقدمه صحيح.",
          "يجب عليك تقديم عنوان بريد إلكتروني فعّال والحفاظ على سرية بيانات حسابك. أنت مسؤول عن جميع الأنشطة التي تتم ضمن حسابك.",
        ],
      },
      {
        heading: "3. ما هو الغرض من Dilva",
        body: [
          "يربط Dilva متعلمي اللغات بمتحدثين أصليين للدردشة، ونشر تحديثات قصيرة للتصحيح، وإيجاد شركاء لغة قريبين. إنه أداة اجتماعية وتعليمية، وليس خدمة مواعدة، أو خدمة ترجمة مأجورة، أو منصة دروس خصوصية احترافية، رغم أن بإمكان الأعضاء استخدامه بأي طريقة يجدونها مفيدة ضمن هذه الشروط.",
        ],
      },
      {
        heading: "4. محتواك",
        body: [
          "تحتفظ بملكية المنشورات والرسائل والصور ومعلومات الملف الشخصي التي تحمّلها (\"محتواك\"). بنشرها على Dilva، فإنك تمنحنا ترخيصاً محدوداً لتخزينها وعرضها ونقلها حسب الحاجة لتشغيل التطبيق (على سبيل المثال، إظهار منشوراتك للمستخدمين الآخرين، أو توصيل رسائل الدردشة إلى المستلم).",
          "أنت المسؤول الوحيد عن محتواك. لا تنشر أي شيء غير قانوني، أو مضايق، أو يحض على الكراهية، أو محتوى جنسي صريح يتعلق بالقاصرين (وهو أمر محظور دائماً دون استثناء)، أو ينتهك حقوق شخص آخر.",
        ],
      },
      {
        heading: "5. سلوك المجتمع",
        body: [
          "كن محترماً. لا تضايق أو تهدد أو تنتحل شخصية أو تحتال على المستخدمين الآخرين. لا تستخدم Dilva للإعلان عن منتجات أو خدمات غير ذات صلة، أو لإنشاء حسابات وهمية/آلية بهدف خداع الأعضاء الحقيقيين.",
          "يمكن للمستخدمين الإبلاغ عن المنشورات أو الرسائل أو الملفات الشخصية التي تخالف هذه القواعد. يجوز لنا مراجعة البلاغات وإزالة المحتوى أو تعليق/إنهاء الحسابات التي تنتهك هذه الشروط، وفق تقديرنا.",
        ],
      },
      {
        heading: "6. ميزات الموقع",
        body: [
          "خريطة \"بالقرب منك\" في Dilva اختيارية: إحداثياتك الدقيقة لا تُعرض أبداً للمستخدمين الآخرين. المواقع المعروضة على الخريطة تُزاح عشوائياً بمقدار يصل إلى نحو 1.5 كم، ولا يمكن تكبير الخريطة أكثر من مستوى ثابت، وذلك تحديداً لضمان عدم تحديد عنوان منزل أي شخص. يمكنك تفعيل أو إيقاف ظهورك في أي وقت من صفحة \"بالقرب منك\".",
          "مشاهدة خريطة \"بالقرب منك\" بحد ذاتها ميزة خاصة بـ Premium؛ أما إمكانية ظهورك لمستخدمي Premium فهي مجانية وتتطلب موافقتك الصريحة.",
        ],
      },
      {
        heading: "7. المدفوعات والاشتراكات (Premium)",
        body: [
          "Dilva Premium هو اشتراك مدفوع يفتح ميزات إضافية (مثل خريطة \"بالقرب منك\"، وزوار الملف الشخصي، ومرشحات البحث). تُعرض الأسعار والمدد قبل الدفع.",
          "يمكن الدفع إما عبر Stripe (بطاقة الدفع) أو عبر طريقة دفع يدوية (تحويل بنكي/بطاقة Qi أو عملة رقمية) نراجعها ونوافق عليها يدوياً. المدفوعات اليدوية ليست فورية: يبدأ وصولك إلى Premium بمجرد تأكيدنا استلام الدفعة، ويجوز لنا رفض مطالبة دفع يدوي لا يمكننا التحقق منها.",
          "لا تتجدد الاشتراكات تلقائياً ما لم يُذكر ذلك صراحة عند الدفع. نحن لا نخزّن بيانات بطاقتك بأنفسنا — تتم معالجة مدفوعات البطاقة بالكامل عبر Stripe.",
          "نظراً لأن المدفوعات اليدوية تتضمن تحويلات بنكية/رقمية حقيقية خارج نطاق حماية المشتري في Stripe، يرجى إرسال الدفعة فقط للخطة والمبلغ الموضحين فعلياً في التطبيق، والاحتفاظ بإيصال التحويل الخاص بك في حال حدوث نزاع.",
        ],
      },
      {
        heading: "8. الإنهاء",
        body: [
          "يمكنك التوقف عن استخدام Dilva وطلب حذف حسابك في أي وقت بالتواصل معنا. يجوز لنا تعليق أو إنهاء الحسابات التي تنتهك هذه الشروط، أو تحاول إساءة استخدام المنصة (بما في ذلك نشاط الروبوتات الآلي غير المصرّح به من قبلنا)، أو تشكل خطراً على المستخدمين الآخرين.",
        ],
      },
      {
        heading: "9. إخلاء المسؤولية",
        body: [
          "يُقدَّم Dilva \"كما هو\". نحن لا نضمن حدوث أي تطابق أو تصحيح أو محادثة معينة، أو أن الخدمة ستكون متواصلة أو خالية من الأخطاء. أنت مسؤول عن سلامتك الخاصة عند مقابلة أو التواصل مع أشخاص تعرفت عليهم عبر Dilva — لا تشارك أبداً معلومات مالية مع شخص تعرفت عليه عبر التطبيق، والتقِ بالأشخاص الجدد في أماكن عامة.",
        ],
      },
      {
        heading: "10. التغييرات على هذه الشروط",
        body: [
          "يجوز لنا تحديث هذه الشروط مع نمو Dilva. إذا أجرينا تغييراً جوهرياً، سنقوم بتحديث تاريخ \"آخر تحديث\" أعلاه. استمرارك في استخدام Dilva بعد أي تغيير يعني أنك تقبل الشروط المحدّثة.",
        ],
      },
      {
        heading: "11. التواصل",
        body: [`يمكن إرسال الأسئلة حول هذه الشروط إلى ${CONTACT_EMAIL}.`],
      },
    ],
  },
  ckb: {
    title: "مەرجەکانی خزمەتگوزاری",
    updated: LAST_UPDATED.ckb,
    sections: [
      {
        heading: "١. ڕەزامەندی",
        body: [
          "بە دروستکردنی هەژمار یان بەکارهێنانی Dilva (\"ئەپەکە\"، \"ئێمە\")، ڕازی دەبیت بەم مەرجەکانی خزمەتگوزاریی. ئەگەر ڕازی نیت، تکایە Dilva بەکارمەهێنە.",
        ],
      },
      {
        heading: "٢. کێ دەتوانێت Dilva بەکاربهێنێت",
        body: [
          "دەبێت تەمەنت لانیکەم ١٦ ساڵ بێت بۆ دروستکردنی هەژمار. بە خۆتۆمارکردن، تۆ پشتڕاست دەکەیتەوە کە بەرواری لەدایکبوونی پێشکەشکراوت ڕاستە.",
          "دەبێت ناونیشانی ئیمەیلێکی کارا دابین بکەیت و زانیاری هەژمارەکەت بە نهێنی بهێڵیتەوە. تۆ بەرپرسیاریت لە هەموو چالاکییەک لەژێر هەژمارەکەتدا.",
        ],
      },
      {
        heading: "٣. Dilva بۆ چییە",
        body: [
          "Dilva فێرخوازانی زمان بە خاوەن زمانە بنەڕەتییەکانەوە دەبەستێتەوە بۆ گفتوگۆکردن، بڵاوکردنەوەی پۆستی کورت بۆ ڕاستکردنەوە، و دۆزینەوەی هاوبەشی زمانی نزیک. ئامرازێکی کۆمەڵایەتی و پەروەردەییە، نەک خزمەتگوزاری هاوبەشیگیری، وەرگێڕانی بەکرێ، یان پلاتفۆرمی وانەدانی پیشەیی — هەرچەندە ئەندامان دەتوانن بە هەر شێوەیەک سوودی لێ ببینن لەناو چوارچێوەی ئەم مەرجانەدا.",
        ],
      },
      {
        heading: "٤. ناوەڕۆکی تۆ",
        body: [
          "خاوەندارێتی پۆست، پەیام، وێنە و زانیاری پرۆفایلی کە بار دەکەیت (\"ناوەڕۆکی تۆ\") بۆ خۆت دەمێنێتەوە. بە بارکردنی لەسەر Dilva، مۆڵەتێکی سنووردارمان پێدەدەیت بۆ پاراستن، پیشاندان و گواستنەوەی بەپێی پێویستی کارکردنی ئەپەکە (بۆ نموونە، پیشاندانی پۆستەکانت بۆ بەکارهێنەرانی تر، یان گەیاندنی پەیامەکانت بۆ وەرگرەکە).",
          "تۆ بە تەنها بەرپرسیاری ناوەڕۆکی خۆیت. هیچ شتێکی نایاسایی، ئازاردەر، ڕق و کینەیی، ناوەڕۆکی سێکسیی پەیوەندیدار بە منداڵانەوە (ئەمە هەمیشە و بێ ئیستیسنا قەدەغەیە)، یان شتێک مافی کەسێکی تر بشکێنێت بڵاو مەکەرەوە.",
        ],
      },
      {
        heading: "٥. ڕەفتاری کۆمەڵگا",
        body: [
          "ڕێزدار بە. بەکارهێنەرانی تر ئازار مەدە، هەڕەشە مەکە، خۆت وەک کەسێکی تر نیشان مەدە، یان فێڵیان لێ مەکە. Dilva بۆ ڕیکلامکردنی بەرهەم/خزمەتگوزاری بێ پەیوەندی، یان دروستکردنی هەژماری ساختە/بۆت بۆ فێڵکردن لە ئەندامە ڕاستەقینەکان بەکارمەهێنە.",
          "بەکارهێنەران دەتوانن پۆست، پەیام یان پرۆفایلی پێشێلکەری ئەم یاسایانە ڕاپۆرت بکەن. لەوانەیە ڕاپۆرتەکان پێداچوونەوەیان بۆ بکەین و، بەپێی بڕیاری خۆمان، ناوەڕۆکی پێشێلکار لاببەین یان هەژماری پێشێلکاری ئەم مەرجانە ڕابگرین/دایبخەین.",
        ],
      },
      {
        heading: "٦. تایبەتمەندییەکانی شوێن",
        body: [
          "نەخشەی \"لە نزیکتەوە\"ی Dilva بە خۆویستنە: هێڵکاریی ڕاستەقینەت هەرگیز بۆ بەکارهێنەرانی تر نیشان نادرێت. شوێنە پیشاندراوەکان لەسەر نەخشە بە هەرەمی هەتا نزیکەی ١.٥ کم دەگۆڕدرێن، و نەخشەکە ناتوانرێت لە ئاستێکی دیاریکراو زیاتر زووم بکرێت — تایبەت بۆ ئەوەی کەس نەگاتە ناونیشانی ماڵێک. دەتوانیت دیاربوونی خۆت هەر کاتێک لە پەڕەی \"لە نزیکتەوە\"ـەوە کراوە یان داخراو بکەیت.",
          "بینینی نەخشەکە خۆی تایبەتمەندییەکی Premium ـە؛ بەڵام دیاربوون بۆ بەکارهێنەرانی Premium بێبەرامبەرە و پێویستی بە ڕەزامەندی ئاشکرای تۆیە.",
        ],
      },
      {
        heading: "٧. پارەدان و بەشداری (Premium)",
        body: [
          "Dilva Premium بەشدارییەکی پارەداره کە تایبەتمەندی زیادە دەکاتەوە (وەک نەخشەی \"لە نزیکتەوە\"، سەردانکەرانی پرۆفایل، و پاڵاوتنی گەڕان). نرخ و ماوەکان پێش پارەدان نیشان دەدرێن.",
          "پارەدان دەتوانرێت لە ڕێگەی Stripe (کارت) یان ڕێگایەکی دەستی (گواستنەوەی بانکی/کارتی Qi یان کریپتۆ) کە بە دەست پێداچوونەوەی بۆ دەکەین و پەسەندی دەکەین، بکرێت. پارەدانی دەستی دەمژمێری نییە: دەستپێکی Premium ـت کاتێک وەرگیراوی پارەکە پشتڕاست دەکەینەوە دەستپێدەکات، و لەوانەیە داواکارییەکی پارەدانی دەستی کە نەتوانین پشتڕاستی بکەینەوە ڕەت بکەینەوە.",
          "بەشدارییەکان خۆکارانە نوێ نابنەوە مەگەر لە کاتی پارەدان بە ئاشکرا وترابێت. ئێمە زانیاری کارتەکەت خۆمان هەڵناگرین — پارەدانی کارت بەتەواوی لەلایەن Stripe ـەوە کار پێ دەکرێت.",
          "لەبەر ئەوەی پارەدانی دەستی گواستنەوەی ڕاستەقینەی بانکی/کریپتۆیە لە دەرەوەی پاراستنی کڕیاری Stripe، تکایە تەنها بۆ پلان و بڕی دیاریکراوی نیشاندراو لە ئەپەکەدا پارە بنێرە، و وەسڵی گواستنەوەی خۆت بۆ هەر ناکۆکییەکی داهاتوو هەڵبگرە.",
        ],
      },
      {
        heading: "٨. ڕاگرتن",
        body: [
          "دەتوانیت بەکارهێنانی Dilva هەر کاتێک ڕابگریت و داوای سڕینەوەی هەژمارەکەت بکەیت بە پەیوەندیکردن لەگەڵمان. لەوانەیە هەژمارێک کە پێشێلی ئەم مەرجانە دەکات، هەوڵی سوکایەتیکردن بە پلاتفۆرمەکە دەدات (لەگەڵ چالاکی بۆتی خۆکار کە ڕێگەمان پێنەداوە)، یان مەترسی بۆ بەکارهێنەرانی تر دروستدەکات، ڕابگرین یان دایبخەین.",
        ],
      },
      {
        heading: "٩. لابردنی بەرپرسیارێتی",
        body: [
          "Dilva وەک \"ئەوەی هەیە\" پێشکەش دەکرێت. ئێمە مسۆگەر ناکەین کە هیچ گونجاندن، ڕاستکردنەوە یان گفتوگۆیەکی دیاریکراو ڕوودەدات، یان خزمەتگوزارییەکە بێ ڕاوەستان و هەڵە دەبێت. تۆ بەرپرسیاری سەلامەتی خۆتیت لە کاتی بینین یان پەیوەندیکردن لەگەڵ کەسانێک کە لە ڕێگەی Dilva ـەوە ناسیوتانن — هەرگیز زانیاری داراییت لەگەڵ کەسێک کە لە ئەپەکەدا ناسیوتە هاوبەش مەکە، و لەگەڵ کەسانی نوێ لە شوێنی گشتیدا کۆببەرەوە.",
        ],
      },
      {
        heading: "١٠. گۆڕانکاری لەم مەرجانە",
        body: [
          "لەگەڵ گەشەکردنی Dilva، لەوانەیە ئەم مەرجانە نوێ بکەینەوە. ئەگەر گۆڕانکارییەکی گرنگ بکەین، بەرواری \"دوایین نوێکردنەوە\"ی سەرەوە نوێ دەکەینەوە. بەردەوامبوون لە بەکارهێنانی Dilva دوای گۆڕانکارییەک، بە مانای پەسەندکردنی مەرجە نوێکراوەکانە.",
        ],
      },
      {
        heading: "١١. پەیوەندی",
        body: [`پرسیار دەربارەی ئەم مەرجانە دەتوانرێت بۆ ${CONTACT_EMAIL} بنێردرێت.`],
      },
    ],
  },
};

export const PRIVACY: Record<Locale, LegalDoc> = {
  en: {
    title: "Privacy Policy",
    updated: LAST_UPDATED.en,
    sections: [
      {
        heading: "1. What this covers",
        body: [
          "This Privacy Policy explains what information Dilva collects, why, and how it is used, stored, and shared. Using Dilva means you agree to this Policy.",
        ],
      },
      {
        heading: "2. Information you provide",
        body: [
          "Account info: email address and password (handled by Supabase Authentication — we never see or store your raw password).",
          "Profile info: username, display name, bio, birth date (used only to enforce the 16+ minimum age and never shown publicly as an exact date), gender (optional), country, city, native and target languages, and profile photo.",
          "Content: posts, comments, likes, corrections, and chat messages you send through Dilva.",
          "Payment info: for Stripe payments, your card details go directly to Stripe and never touch our servers. For manual payments (bank/Qi Card/crypto), we only see the note you submit with your claim (for example, a transaction reference) — never full card or bank account numbers.",
        ],
      },
      {
        heading: "3. Information collected automatically",
        body: [
          "Location: only if you explicitly enable it, your device's GPS coordinates are stored so nearby matches can be shown. As explained in the Terms, the location shown to other users is randomly offset by up to ~1.5 km, never exact.",
          "Basic technical data (such as timestamps of activity, e.g. when you last read a chat, or when a post was made) needed to operate features like read receipts and the activity feed.",
        ],
      },
      {
        heading: "4. How we use your information",
        body: [
          "To operate core features: matching you with language partners, showing your posts and profile to other users, delivering chat messages, and showing your approximate location on the Nearby map if you opt in.",
          "To process payments and activate/manage your Premium subscription.",
          "To keep the platform safe: reviewing reports of abusive content, and where necessary suspending accounts that violate our Terms.",
          "We do not sell your personal information to third parties, and we do not use your data to show you third-party advertising.",
        ],
      },
      {
        heading: "5. Who your information is shared with",
        body: [
          "Other users see what your profile and privacy choices make visible: your posts, your public profile info, your (fuzzed) location if you opt into Nearby, and any messages you send them directly.",
          "Service providers we rely on to run Dilva: Supabase (authentication, database, and photo storage), Stripe (card payments), OpenStreetMap (map tiles for the Nearby feature), and a translation service used for the in-chat translate button. Each of these providers only receives the data needed to perform their function.",
          "We may disclose information if required by law, or to protect the safety of our users or the public.",
        ],
      },
      {
        heading: "6. Data retention and deletion",
        body: [
          "We keep your account data for as long as your account is active. If you ask us to delete your account, we will delete your profile, posts, messages, and location data, except where we're required to keep limited records (for example, payment records) for legal or accounting reasons.",
        ],
      },
      {
        heading: "7. Your choices",
        body: [
          "You can edit most of your profile information at any time from Settings. You can turn Nearby location visibility on or off at any time. You can delete individual posts and messages you've sent. You can request full account deletion by contacting us.",
        ],
      },
      {
        heading: "8. Children's privacy",
        body: [
          "Dilva is not directed at children under 16, and we do not knowingly collect information from anyone under that age. If we learn that an account belongs to someone under 16, we will remove the account.",
        ],
      },
      {
        heading: "9. Security",
        body: [
          "We use industry-standard tools (Supabase Authentication, encrypted connections) to protect your data, but no online service can guarantee perfect security. Please use a strong, unique password.",
        ],
      },
      {
        heading: "10. Changes to this Policy",
        body: [
          "We may update this Privacy Policy as Dilva changes. We will update the \"last updated\" date above whenever we do.",
        ],
      },
      {
        heading: "11. Contact",
        body: [`Questions or requests about your data can be sent to ${CONTACT_EMAIL}.`],
      },
    ],
  },
  tr: {
    title: "Gizlilik Politikası",
    updated: LAST_UPDATED.tr,
    sections: [
      {
        heading: "1. Bu politika neyi kapsar",
        body: [
          "Bu Gizlilik Politikası, Dilva'nın hangi bilgileri, neden topladığını ve bunların nasıl kullanıldığını, saklandığını ve paylaşıldığını açıklar. Dilva'yı kullanmanız bu Politikayı kabul ettiğiniz anlamına gelir.",
        ],
      },
      {
        heading: "2. Sağladığınız bilgiler",
        body: [
          "Hesap bilgileri: e-posta adresi ve şifre (Supabase Authentication tarafından yönetilir — ham şifrenizi asla görmeyiz veya saklamayız).",
          "Profil bilgileri: kullanıcı adı, görünen ad, biyografi, doğum tarihi (yalnızca 16+ yaş sınırını uygulamak için kullanılır ve asla tam tarih olarak herkese açık gösterilmez), cinsiyet (isteğe bağlı), ülke, şehir, anadil ve öğrenilen diller, profil fotoğrafı.",
          "İçerik: Dilva üzerinden gönderdiğiniz gönderiler, yorumlar, beğeniler, düzeltmeler ve sohbet mesajları.",
          "Ödeme bilgileri: Stripe ödemelerinde kart bilgileriniz doğrudan Stripe'a gider, sunucularımıza asla ulaşmaz. Manuel ödemelerde (banka/Qi Card/kripto) yalnızca talebinizle birlikte gönderdiğiniz notu (örneğin bir işlem referansı) görürüz — tam kart veya banka hesap numaralarını asla.",
        ],
      },
      {
        heading: "3. Otomatik olarak toplanan bilgiler",
        body: [
          "Konum: yalnızca açıkça etkinleştirirseniz, cihazınızın GPS koordinatları yakın eşleşmelerin gösterilebilmesi için saklanır. Koşullar'da açıklandığı gibi, diğer kullanıcılara gösterilen konum rastgele olarak ~1,5 km'ye kadar kaydırılır, asla tam konum değildir.",
          "Okundu bilgisi ve etkinlik akışı gibi özellikleri çalıştırmak için gerekli temel teknik veriler (örneğin bir sohbeti son okuduğunuz zaman veya bir gönderinin yapıldığı zaman).",
        ],
      },
      {
        heading: "4. Bilgilerinizi nasıl kullanıyoruz",
        body: [
          "Temel özellikleri çalıştırmak için: sizi dil partnerleriyle eşleştirmek, gönderilerinizi ve profilinizi diğer kullanıcılara göstermek, sohbet mesajlarını iletmek ve tercih ederseniz yaklaşık konumunuzu Yakınımdakiler haritasında göstermek.",
          "Ödemeleri işlemek ve Premium aboneliğinizi etkinleştirmek/yönetmek için.",
          "Platformu güvenli tutmak için: kötüye kullanım şikayetlerini incelemek ve gerektiğinde Koşullarımızı ihlal eden hesapları askıya almak.",
          "Kişisel bilgilerinizi üçüncü taraflara satmayız ve verilerinizi size üçüncü taraf reklamları göstermek için kullanmayız.",
        ],
      },
      {
        heading: "5. Bilgileriniz kimlerle paylaşılır",
        body: [
          "Diğer kullanıcılar, profilinizin ve gizlilik tercihlerinizin görünür kıldığı şeyleri görür: gönderileriniz, herkese açık profil bilgileriniz, Yakınımdakiler'e katılırsanız (bulanıklaştırılmış) konumunuz ve onlara doğrudan gönderdiğiniz mesajlar.",
          "Dilva'yı çalıştırmak için güvendiğimiz hizmet sağlayıcılar: Supabase (kimlik doğrulama, veritabanı ve fotoğraf depolama), Stripe (kart ödemeleri), OpenStreetMap (Yakınımdakiler için harita karoları) ve sohbet içi çeviri düğmesi için kullanılan bir çeviri hizmeti. Bu sağlayıcıların her biri yalnızca işlevini yerine getirmek için gereken verileri alır.",
          "Yasalar gerektirdiğinde veya kullanıcılarımızın ya da kamunun güvenliğini korumak için bilgi ifşa edebiliriz.",
        ],
      },
      {
        heading: "6. Veri saklama ve silme",
        body: [
          "Hesap verilerinizi hesabınız aktif olduğu sürece saklarız. Hesabınızın silinmesini talep ederseniz, yasal veya muhasebe nedenleriyle sınırlı kayıtları (örneğin ödeme kayıtlarını) tutmamız gereken durumlar dışında profilinizi, gönderilerinizi, mesajlarınızı ve konum verilerinizi sileriz.",
        ],
      },
      {
        heading: "7. Seçenekleriniz",
        body: [
          "Profil bilgilerinizin çoğunu istediğiniz zaman Ayarlar'dan düzenleyebilirsiniz. Yakınımdakiler konum görünürlüğünü istediğiniz zaman açıp kapatabilirsiniz. Gönderdiğiniz tek tek gönderi ve mesajları silebilirsiniz. Bize ulaşarak tam hesap silinmesi talep edebilirsiniz.",
        ],
      },
      {
        heading: "8. Çocukların gizliliği",
        body: [
          "Dilva, 16 yaşından küçük çocuklara yönelik değildir ve bilerek bu yaşın altındaki kimseden bilgi toplamayız. Bir hesabın 16 yaşından küçük birine ait olduğunu öğrenirsek, hesabı kaldırırız.",
        ],
      },
      {
        heading: "9. Güvenlik",
        body: [
          "Verilerinizi korumak için sektör standardı araçlar (Supabase Authentication, şifreli bağlantılar) kullanıyoruz, ancak hiçbir çevrimiçi hizmet mükemmel güvenliği garanti edemez. Lütfen güçlü ve benzersiz bir şifre kullanın.",
        ],
      },
      {
        heading: "10. Bu Politikadaki değişiklikler",
        body: [
          "Dilva değiştikçe bu Gizlilik Politikasını güncelleyebiliriz. Her güncellemede yukarıdaki \"son güncelleme\" tarihini değiştiririz.",
        ],
      },
      {
        heading: "11. İletişim",
        body: [`Verileriniz hakkında sorular veya talepler için ${CONTACT_EMAIL} adresine yazabilirsiniz.`],
      },
    ],
  },
  ku: {
    title: "سیاسەتا نهێنیێ",
    updated: LAST_UPDATED.ku,
    sections: [
      {
        heading: "١. ئەڤ سیاسەته چ دگریته بەر",
        body: [
          "ئەڤ سیاسەتا نهێنیێ ڕوون دکەت کا Dilva چ زانیارییان، بو چ مەبەستێ کوم دکەت، و ب چ شێوەیێ بکاردئنیت، دپاریزیت و بلاڤ دکەت. بکارئنانا Dilva بمانایا پەسەندکرنا ڤێ سیاسەتێیه.",
        ],
      },
      {
        heading: "٢. زانیارییێن تو پێشکێش دکەی",
        body: [
          "زانیارییێن حسابێ: ئیمەیل و شیفره (ب رێکا Supabase Authentication تێته بەڕێڤەبرن — ئەم چو کات شیفرا تە یا خاو نابینین یان نافارزینین).",
          "زانیارییێن profilی: ناڤێ بکارهئنانێ، ناڤێ دیارکری، بایۆ، دیرۆکا ژدایکبوونێ (ب تنێ بو پراکتیزەکرنا سنووری هندی ١٦ سالان بکاردهێت و چو کات وەکی دیرۆکەکا تەواو ب ئاشکرا نایێته پیشاندان)، ڕەگەز (ب خۆویستنه)، وەلات، شار، زمانێن دایکی و فێربوی، و وئنا profilی.",
          "ناڤەرۆک: پۆست، کۆمێنت، لایک، ڕاستکرن و پەیامێن چاتێ یێن تو ژ ڕێکا Dilva دنێری.",
          "زانیارییێن پارەدانێ: بو پارەدانا Stripe، زانیارییێن کارتێ تە ڕاستەوخۆ دچنه Stripe و چو کات ناگەهنه سێرڤەرێن مه. بو پارەدانا دەستی (بانکی/Qi Card/کریپتۆ)، ئەم ب تنێ نۆتا تو دگەل داواکارییا خۆ دنێری دبینین (بو نموونه، ژمارا مامەلەیێ) — چو کات ژمارا تەواو یا کارت یان حسابێ بانکی نابینین.",
        ],
      },
      {
        heading: "٣. زانیارییێن ب شێوەیێ ئۆتۆماتیکی تێنه کومکرن",
        body: [
          "جهـ (Location): ب تنێ ئەگەر تو ب ئاشکرا ڤەکەی، کۆردیناتێن GPS یێن ئامێرێ تە تێنه پاراستن دا هاوتایێن نزیک بهێنه پیشاندان. وەکی د مەرجان دا هاتیه ڕوونکرن، جهێ بو کاربەرێن دی تێته پیشاندان ب شێوەیەکێ هەرەمیکی هەتا ١.٥ کم دهێته گوهرین، چو کات جهێ راستەقینه نینه.",
          "زانیارییێن تەکنیکی یێن سادە (وەکی دەمژمێرا خواندنا پەیامان یان دەمژمێرا پۆستەکێ) یێن پێدڤیه بو کارکرنا فەزلێن وەکی \"خواندی\" و لیستا چالاکییان.",
        ],
      },
      {
        heading: "٤. ئەم چاوا زانیارییێن تە بکاردئینین",
        body: [
          "بو کارکرنا فەزلێن سەرەکی: هاوتاکرنا تە دگەل هاڤاڵێن زمانی، پیشاندانا پۆست و profilێ تە بو کاربەرێن دی، گەهاندنا پەیامێن چاتێ، و پیشاندانا جهێ تە یێ نزیکی ل سەر نەخشا نزیکی من ئەگەر تو ب خۆویستنه ڤەکەی.",
          "بو پرۆسەکرنا پارەدانان و چالاککرن/بەڕێڤەبرنا ئابونمانا Premium یا تە.",
          "بو پاراستنا سەلامەتییا platformê: پشکنینا ڕاپۆرتێن سویاستنێ، و لدو کات پێدڤی، ڕاوەستاندنا حسابێن ڤان مەرجان دشکینن.",
          "ئەم زانیارییێن کەسایەتی یێن تە نافرۆشین بو لایێن سێیەم، و زانیارییێن تە بکار نائینین دا ڕیکلامێن لایێن سێیەم پیشانا تە بدەین.",
        ],
      },
      {
        heading: "٥. زانیارییێن تە دگەل کێ تێنه بلاڤکرن",
        body: [
          "کاربەرێن دی ئەوێ دبینن یا profil و هەلبژارتنێن نهێنیێ یێن تە دیار دکەن: پۆستێن تە، زانیارییێن profilی یێن گشتی، جهێ تە (یێ گوهراندی) ئەگەر تو بەشداری نزیکی من بکەی، و پەیامێن تو ڕاستەوخۆ بو وان دنێری.",
          "دابینکەرێن خزمەتگوزاریێ یێن ئەم پشتی وان دبەین دا Dilva بمشیت: Supabase (پشتراستکرن، بنکەیا زانیاری و پاراستنا وئنان)، Stripe (پارەدانا کارتێ)، OpenStreetMap (کاشێن نەخشێ بو فەزلا نزیکی من)، و خزمەتگوزارییەکا وەرگێڕانێ یا بو دوگمەیا وەرگێڕانا د چاتێ دا بکاردهێت. هەریەک ژ ڤان دابینکەران ب تنێ ئەوێ زانیاریان وەردگرن یێن بو ئەرکێ خۆ پێدڤی نه.",
          "ئەم دشێین زانیاریان ئاشکرا بکەین ئەگەر یاسایان ئەوه بخوازیت، یان بو پاراستنا سەلامەتییا کاربەرێن مه یان گشتییێ.",
        ],
      },
      {
        heading: "٦. پاراستن و سڕینا زانیارییان",
        body: [
          "ئەم زانیارییێن حسابێ تە ھەتا حساب چالاکه دپارێزین. ئەگەر تو داخازا سڕینا حسابێ خۆ ژمە بکەی، ئەم profil، پۆست، پەیام و زانیارییێن جهێ تە دسڕین، ژبلی ئەوێ بو هۆکارێن یاسایی یان موحاسەبەیێ پێدڤیه ئەم تۆمارەکا سنووردار بپارێزین (بو نموونه، تۆمارێن پارەدانێ).",
        ],
      },
      {
        heading: "٧. هەلبژارتنێن تە",
        body: [
          "تو دشێی زۆرینا زانیارییێن profilێ خۆ هەر دەم ژ Settings بگوهرینی. تو دشێی دیارتیبوونا جهێ خۆ یا نزیکی من هەر دەم ڤەکەی یان دابخی. تو دشێی پۆست و پەیامێن تو ب خۆ نڤیسینه یەک ب یەک بسڕی. تو دشێی ب پەیوەندیکرنا دگەل مه داخازا سڕینا تەواوی حسابێ خۆ بکەی.",
        ],
      },
      {
        heading: "٨. نهێنیا زاروکان",
        body: [
          "Dilva بو زاروکێن ژ ١٦ سالان بچووکتر نینه، و ئەم ب زانین زانیاریان ژ کەسەکێ ژ ڤی تەمەنی بچووکتر کومناکەین. ئەگەر ئەم فێربین کو حسابەک یێ کەسەکێ ژ ١٦ سالان بچووکتره، ئەم ئەو حسابێ ڕادکەین.",
        ],
      },
      {
        heading: "٩. ئاسایش",
        body: [
          "ئەم ئامرازێن ستانداردا پیشەیێ (Supabase Authentication، پەیوەندییێن شیفرەیی) بکاردئینین دا زانیارییێن تە بپارێزین، بەلێ چو خزمەتگوزارییەکا ئۆنلاین ناشێت ئاسایشەکا تەواو گرەنتی بکەت. ژکەرەم شیفرەیەکا بهێز و تایبەت بکاربینه.",
        ],
      },
      {
        heading: "١٠. گوهرینا ڤێ سیاسەتێ",
        body: [
          "دگەل گوهرینا Dilva، ئەم دشێین ڤێ سیاسەتا نهێنیێ نویکەین. هەر گاڤا ئەم گوهرینەکێ چێبکەین، دیرۆکا \"دویماهیک نویکری\" یا سەرو دئ نویکەین.",
        ],
      },
      {
        heading: "١١. پەیوەندی",
        body: [`پرسیار یان داواکارییێن دەربارەی زانیارییێن تە دشێن بو ${CONTACT_EMAIL} بهێنه نڤیسین.`],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: LAST_UPDATED.ar,
    sections: [
      {
        heading: "1. ما يغطيه هذا المستند",
        body: [
          "توضح سياسة الخصوصية هذه ما هي المعلومات التي يجمعها Dilva، ولماذا، وكيف يتم استخدامها وتخزينها ومشاركتها. استخدامك لـ Dilva يعني موافقتك على هذه السياسة.",
        ],
      },
      {
        heading: "2. المعلومات التي تقدمها",
        body: [
          "معلومات الحساب: عنوان البريد الإلكتروني وكلمة المرور (تُدار عبر Supabase Authentication — نحن لا نرى أو نخزّن كلمة مرورك الأصلية أبداً).",
          "معلومات الملف الشخصي: اسم المستخدم، الاسم المعروض، النبذة التعريفية، تاريخ الميلاد (يُستخدم فقط لتطبيق الحد الأدنى للعمر 16 عاماً ولا يُعرض للعامة كتاريخ دقيق أبداً)، الجنس (اختياري)، البلد، المدينة، اللغة الأم واللغات المستهدفة، وصورة الملف الشخصي.",
          "المحتوى: المنشورات والتعليقات والإعجابات والتصحيحات ورسائل الدردشة التي ترسلها عبر Dilva.",
          "معلومات الدفع: بالنسبة لمدفوعات Stripe، تذهب بيانات بطاقتك مباشرة إلى Stripe ولا تصل إلى خوادمنا أبداً. بالنسبة للمدفوعات اليدوية (بنك/بطاقة Qi/عملة رقمية)، نرى فقط الملاحظة التي ترسلها مع طلبك (مثل مرجع المعاملة) — وليس أرقام البطاقة أو الحساب البنكي الكاملة أبداً.",
        ],
      },
      {
        heading: "3. المعلومات التي تُجمع تلقائياً",
        body: [
          "الموقع: فقط إذا فعّلته صراحة، يتم تخزين إحداثيات GPS لجهازك حتى يمكن إظهار التطابقات القريبة. كما هو موضح في الشروط، فإن الموقع المعروض للمستخدمين الآخرين يُزاح عشوائياً بمقدار يصل إلى ~1.5 كم، وليس دقيقاً أبداً.",
          "بيانات تقنية أساسية (مثل الطوابع الزمنية للنشاط، مثل آخر مرة قرأت فيها محادثة، أو وقت نشر منشور) ضرورية لتشغيل ميزات مثل إشعارات القراءة وتغذية النشاط.",
        ],
      },
      {
        heading: "4. كيف نستخدم معلوماتك",
        body: [
          "لتشغيل الميزات الأساسية: مطابقتك مع شركاء اللغة، إظهار منشوراتك وملفك الشخصي للمستخدمين الآخرين، توصيل رسائل الدردشة، وإظهار موقعك التقريبي على خريطة \"بالقرب منك\" إذا اخترت ذلك.",
          "لمعالجة المدفوعات وتفعيل/إدارة اشتراكك في Premium.",
          "للحفاظ على أمان المنصة: مراجعة بلاغات المحتوى المسيء، وعند الضرورة تعليق الحسابات التي تنتهك شروطنا.",
          "نحن لا نبيع معلوماتك الشخصية لأطراف ثالثة، ولا نستخدم بياناتك لعرض إعلانات من أطراف ثالثة.",
        ],
      },
      {
        heading: "5. مع من تتم مشاركة معلوماتك",
        body: [
          "يرى المستخدمون الآخرون ما تجعله إعدادات ملفك الشخصي وخصوصيتك مرئياً: منشوراتك، معلومات ملفك الشخصي العامة، موقعك (المموّه) إذا اخترت المشاركة في \"بالقرب منك\"، وأي رسائل ترسلها إليهم مباشرة.",
          "مزودو الخدمة الذين نعتمد عليهم لتشغيل Dilva: Supabase (المصادقة، قاعدة البيانات، وتخزين الصور)، Stripe (مدفوعات البطاقات)، OpenStreetMap (خرائط ميزة \"بالقرب منك\")، وخدمة ترجمة تُستخدم لزر الترجمة داخل الدردشة. كل من هؤلاء المزودين يتلقى فقط البيانات اللازمة لأداء وظيفته.",
          "يجوز لنا الإفصاح عن المعلومات إذا اقتضى القانون ذلك، أو لحماية سلامة مستخدمينا أو الجمهور.",
        ],
      },
      {
        heading: "6. الاحتفاظ بالبيانات وحذفها",
        body: [
          "نحتفظ ببيانات حسابك طالما أن حسابك نشط. إذا طلبت منا حذف حسابك، سنقوم بحذف ملفك الشخصي ومنشوراتك ورسائلك وبيانات موقعك، باستثناء الحالات التي يتطلب فيها القانون أو المحاسبة الاحتفاظ بسجلات محدودة (مثل سجلات الدفع).",
        ],
      },
      {
        heading: "7. خياراتك",
        body: [
          "يمكنك تعديل معظم معلومات ملفك الشخصي في أي وقت من الإعدادات. يمكنك تفعيل أو إيقاف ظهور موقعك في \"بالقرب منك\" في أي وقت. يمكنك حذف المنشورات والرسائل الفردية التي أرسلتها. يمكنك طلب حذف الحساب بالكامل بالتواصل معنا.",
        ],
      },
      {
        heading: "8. خصوصية الأطفال",
        body: [
          "لا يستهدف Dilva الأطفال دون سن 16 عاماً، ولا نجمع عن قصد معلومات من أي شخص دون هذا العمر. إذا علمنا أن حساباً ما يخص شخصاً دون 16 عاماً، سنقوم بإزالة الحساب.",
        ],
      },
      {
        heading: "9. الأمان",
        body: [
          "نستخدم أدوات معيارية في هذا المجال (Supabase Authentication، اتصالات مشفّرة) لحماية بياناتك، لكن لا يمكن لأي خدمة عبر الإنترنت أن تضمن أماناً مثالياً. يرجى استخدام كلمة مرور قوية وفريدة.",
        ],
      },
      {
        heading: "10. التغييرات على هذه السياسة",
        body: [
          "يجوز لنا تحديث سياسة الخصوصية هذه مع تطور Dilva. سنقوم بتحديث تاريخ \"آخر تحديث\" أعلاه كلما فعلنا ذلك.",
        ],
      },
      {
        heading: "11. التواصل",
        body: [`يمكن إرسال الأسئلة أو الطلبات المتعلقة ببياناتك إلى ${CONTACT_EMAIL}.`],
      },
    ],
  },
  ckb: {
    title: "سیاسەتی تایبەتمەندی",
    updated: LAST_UPDATED.ckb,
    sections: [
      {
        heading: "١. ئەمە چی دەگرێتەوە",
        body: [
          "ئەم سیاسەتی تایبەتمەندییە ڕوون دەکاتەوە کە Dilva چ زانیارییەک، بۆچی کۆدەکاتەوە، و چۆن بەکاردەهێنرێت، هەڵدەگیرێت و هاوبەش دەکرێت. بەکارهێنانی Dilva بە مانای ڕەزامەندیت لەسەر ئەم سیاسەتەیە.",
        ],
      },
      {
        heading: "٢. زانیارییەکانی کە پێشکەشیان دەکەیت",
        body: [
          "زانیاری هەژمار: ناونیشانی ئیمەیل و وشەی نهێنی (لەلایەن Supabase Authentication ـەوە بەڕێوەدەبرێت — ئێمە هەرگیز وشەی نهێنیی ڕەسەنت نابینین یان هەڵی ناگرین).",
          "زانیاری پرۆفایل: ناوی بەکارهێنەر، ناوی دەرکەوتن، ناساندن، بەرواری لەدایکبوون (تەنها بۆ جێبەجێکردنی سنووری تەمەنی ١٦+ بەکاردێت و هەرگیز وەک بەرواری وردی گشتی نیشان نادرێت)، ڕەگەز (ئارەزوومەندانە)، وڵات، شار، زمانی دایکی و ئامانج، و وێنەی پرۆفایل.",
          "ناوەڕۆک: پۆست، بۆچوون، پەسەندکردن، ڕاستکردنەوە و پەیامی چاتی کە لە ڕێگەی Dilva ـەوە دەینێریت.",
          "زانیاری پارەدان: بۆ پارەدانی Stripe، زانیاری کارتەکەت ڕاستەوخۆ دەچێتە Stripe و هەرگیز ناگاتە سێرڤەرەکانمان. بۆ پارەدانی دەستی (بانک/کارتی Qi/کریپتۆ)، ئێمە تەنها ئەو تێبینییە دەبینین کە لەگەڵ داواکارییەکەتدا دەینێریت (بۆ نموونە، ژمارەی مامەڵە) — هەرگیز ژمارەی تەواوی کارت یان هەژماری بانکی نا.",
        ],
      },
      {
        heading: "٣. زانیارییەکانی کە بەخۆکارانە کۆدەکرێنەوە",
        body: [
          "شوێن: تەنها ئەگەر بە ئاشکرا چالاکی بکەیت، هێڵکاریی GPS ی ئامێرەکەت هەڵدەگیرێت تاکو گونجاوی نزیک نیشان بدرێت. وەک لە مەرجەکاندا ڕوونکراوەتەوە، شوێنی پیشاندراو بۆ بەکارهێنەرانی تر بە هەرەمی هەتا نزیکەی ١.٥ کم دەگۆڕدرێت، هەرگیز وردی نییە.",
          "زانیاری تەکنیکیی سادە (وەک کاتی چالاکی، بۆ نموونە کاتێک دواجار چاتێکت خوێندووەتەوە، یان کاتی بڵاوکردنەوەی پۆستێک) کە بۆ کارکردنی تایبەتمەندییەکانی وەک پشتڕاستکردنەوەی خوێندنەوە و لیستی چالاکی پێویستە.",
        ],
      },
      {
        heading: "٤. چۆن زانیارییەکانت بەکاردەهێنین",
        body: [
          "بۆ کارکردنی تایبەتمەندییە سەرەکییەکان: گونجاندنت لەگەڵ هاوبەشانی زمان، پیشاندانی پۆست و پرۆفایلەکەت بۆ بەکارهێنەرانی تر، گەیاندنی پەیامی چات، و پیشاندانی شوێنی نزیکی تۆ لەسەر نەخشەی \"لە نزیکتەوە\" ئەگەر ڕازیبوویت.",
          "بۆ پرۆسەکردنی پارەدان و چالاککردن/بەڕێوەبردنی بەشداریی Premium ـت.",
          "بۆ پاراستنی ئاسایشی پلاتفۆرمەکە: پێداچوونەوە بۆ ڕاپۆرتی ناوەڕۆکی سوکایەتیکار، و لە کاتی پێویستدا ڕاگرتنی هەژمارانێک کە مەرجەکانمان دەشکێنن.",
          "ئێمە زانیاری کەسیت بۆ لایەنی سێیەم نافرۆشین، و زانیارییەکانت بەکارناهێنین بۆ نیشاندانی ڕیکلامی لایەنی سێیەم بۆت.",
        ],
      },
      {
        heading: "٥. زانیارییەکانت لەگەڵ کێ هاوبەش دەکرێن",
        body: [
          "بەکارهێنەرانی تر ئەوە دەبینن کە هەڵبژاردنی نهێنی و پرۆفایلەکەت دیاری دەکات: پۆستەکانت، زانیاری گشتیی پرۆفایلت، شوێنت (گۆڕدراو) ئەگەر بەشداری \"لە نزیکتەوە\" بکەیت، و هەر پەیامێک کە ڕاستەوخۆ بۆیان دەنێریت.",
          "دابینکەرانی خزمەتگوزاری کە پشتیان پێ دەبەستین بۆ کارپێکردنی Dilva: Supabase (پشتڕاستکردنەوە، بنکەدراوە و هەڵگرتنی وێنە)، Stripe (پارەدانی کارت)، OpenStreetMap (تایلی نەخشە بۆ تایبەتمەندیی \"لە نزیکتەوە\")، و خزمەتگوزارییەکی وەرگێڕان کە بۆ دوگمەی وەرگێڕانی ناوچات بەکاردێت. هەریەکە لەم دابینکەرانە تەنها ئەو زانیارییە وەردەگرێت کە بۆ ئەرکەکەی پێویستە.",
          "لەوانەیە زانیاری ئاشکرا بکەین ئەگەر یاسا داوای بکات، یان بۆ پاراستنی ئاسایشی بەکارهێنەرەکانمان یان گشتی.",
        ],
      },
      {
        heading: "٦. هەڵگرتن و سڕینەوەی داتا",
        body: [
          "داتای هەژمارەکەت هەتا هەژمارەکەت چالاکە هەڵدەگرین. ئەگەر داوامان لێبکەیت هەژمارەکەت بسڕینەوە، پرۆفایل، پۆست، پەیام و داتای شوێنت دەسڕینەوە، جگە لەو حاڵەتانەی کە یاسا یان ژمێریاری پێویستمان دەکات تۆمارێکی سنووردار هەڵبگرین (بۆ نموونە، تۆماری پارەدان).",
        ],
      },
      {
        heading: "٧. هەڵبژاردنەکانت",
        body: [
          "دەتوانیت زۆربەی زانیاری پرۆفایلەکەت هەر کاتێک لە ڕێکخستنەکانەوە دەستکاری بکەیت. دەتوانیت دیاربوونی شوێنت لە \"لە نزیکتەوە\" هەر کاتێک کراوە یان داخراو بکەیت. دەتوانیت پۆست و پەیامی تاکەکەسیی کە ناردووتانە بسڕیتەوە. دەتوانیت داوای سڕینەوەی تەواوی هەژمار بکەیت بە پەیوەندیکردن لەگەڵمان.",
        ],
      },
      {
        heading: "٨. تایبەتمەندیی منداڵان",
        body: [
          "Dilva ئامانج لە منداڵانی خوار ١٦ ساڵ ناگرێت، و بە زانینەوە زانیاری لە کەسێکی خوار ئەم تەمەنە کۆناکەینەوە. ئەگەر بزانین هەژمارێک هی کەسێکی خوار ١٦ ساڵە، هەژمارەکە لادەبەین.",
        ],
      },
      {
        heading: "٩. ئاسایش",
        body: [
          "ئامرازی ستانداردی پیشەیی (Supabase Authentication، پەیوەندیی نهێنیکراو) بەکاردەهێنین بۆ پاراستنی داتاکەت، بەڵام هیچ خزمەتگوزارییەکی ئۆنلاین ناتوانێت ئاسایشی تەواو مسۆگەر بکات. تکایە وشەی نهێنیی بەهێز و تایبەت بەکاربهێنە.",
        ],
      },
      {
        heading: "١٠. گۆڕانکاری لەم سیاسەتە",
        body: [
          "لەگەڵ گۆڕانی Dilva، لەوانەیە ئەم سیاسەتی تایبەتمەندییە نوێ بکەینەوە. هەر کاتێک ئەوە بکەین، بەرواری \"دوایین نوێکردنەوە\"ی سەرەوە نوێ دەکەینەوە.",
        ],
      },
      {
        heading: "١١. پەیوەندی",
        body: [`پرسیار یان داواکاری دەربارەی داتاکەت دەتوانرێت بۆ ${CONTACT_EMAIL} بنێردرێت.`],
      },
    ],
  },
};
