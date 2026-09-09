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

type Locale = "ku" | "tr" | "en";

const LAST_UPDATED: Record<Locale, string> = {
  ku: "٩ی ئەیلولا ٢٠٢٦",
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
};
