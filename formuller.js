/* Net Kalkanım - Formüller
   Derslere göre dizilmiş, arama yapılabilen bir formül başvuru bölümü. Tekrar kutularına GİRMEZ (ezberlenecek kart değil, bakılacak yer).
   - Hazır formüller (BUILTIN): herkeste görünür. Yeni formül eklemek için listeye bir satır eklemek yeterli.
   - Kişisel formüller: kullanıcı ekler (elle ya da Gemini ile), ayarlarla birlikte buluta yedeklenir (appState.formuller).
   - Favoriler (yıldız) cihaza özel tutulur. */
(function () {
  'use strict';

  /* ---------- Hazır formüller (herkeste) ----------
     { id: 'benzersiz-kısa-ad', ders: 'TYT MATEMATİK', baslik: 'Başlık', formul: 'Formül metni', kaynak: 'İsteğe bağlı: nereden geldiği' }
     ders, uygulamadaki ders adıyla aynı olmalı (TYT MATEMATİK, AYT FİZİK ...). */
  var BUILTIN = [
    { id: 'fz1', ders: 'AYT FİZİK', baslik: "Vektörler (Bileşke Büyüklüğü)", formul: "$R^2 = F_1^2 + F_2^2 + 2 F_1 F_2 \\cos\\alpha$" },
    { id: 'fz2', ders: 'AYT FİZİK', baslik: "Bağıl Hız", formul: "$\\vec{v}_{\\text{bağıl}} = \\vec{v}_{\\text{gözlenen}} - \\vec{v}_{\\text{gözlemci}}$" },
    { id: 'fz3', ders: 'AYT FİZİK', baslik: "Tork ve Denge", formul: "Tork: $\\tau = F \\cdot d \\cdot \\sin\\theta$\nKütle merkezi koordinatı: $x_{\\text{km}} = \\frac{\\sum m_i x_i}{\\sum m_i}$" },
    { id: 'fz4', ders: 'AYT FİZİK', baslik: "Basit Makineler", formul: "İş prensibi: $F \\cdot x_F = P \\cdot x_P$\nVida denklemi: $F \\cdot 2\\pi r = R \\cdot a$\nVerim: $\\text{Verim} = \\frac{W_{\\text{alınan}}}{W_{\\text{verilen}}}$" },
    { id: 'fz5', ders: 'AYT FİZİK', baslik: "Newton’un Hareket Yasaları", formul: "Net kuvvet: $F_{\\text{net}} = m \\cdot a$\nSürtünme kuvveti: $f_s = k \\cdot N$" },
    { id: 'fz6', ders: 'AYT FİZİK', baslik: "Bir Boyutta Sabit İvmeli Hareket", formul: "Son hız: $v = v_0 \\pm a t$\nYer değiştirme: $x = v_0 t \\pm \\frac{1}{2} a t^2$\nZamansız hız: $v^2 = v_0^2 \\pm 2 a x$" },
    { id: 'fz7', ders: 'AYT FİZİK', baslik: "Atışlar", formul: "Serbest düşme yüksekliği: $h = \\frac{1}{2} g t^2$\nEğik atış uçuş süresi: $t_{\\text{uçuş}} = \\frac{2 v_{0y}}{g}$\nMaksimum yükseklik: $h_{\\text{max}} = \\frac{v_{0y}^2}{2g}$\nYatay menzil: $x_{\\text{menzil}} = v_{0x} \\cdot t_{\\text{uçuş}}$" },
    { id: 'fz8', ders: 'AYT FİZİK', baslik: "İş, Güç ve Enerji", formul: "Mekanik iş: $W = F \\cdot \\Delta x \\cdot \\cos\\theta$\nÖteleme kinetik enerjisi: $E_k = \\frac{1}{2} m v^2$\nYer çekimi potansiyel enerjisi: $E_p = m g h$\nYay potansiyel enerjisi: $E_{\\text{yay}} = \\frac{1}{2} k x^2$\nGüç: $P = \\frac{W}{t}$" },
    { id: 'fz9', ders: 'AYT FİZİK', baslik: "İtme ve Momentum", formul: "İtme: $\\vec{I} = \\vec{F}_{\\text{ort}} \\cdot \\Delta t = \\Delta \\vec{P}$\nÇizgisel momentum: $\\vec{P} = m \\cdot \\vec{v}$\nMomentum korunumu: $\\vec{P}_{\\text{ilk}} = \\vec{P}_{\\text{son}}$\nEsnek çarpışmada hız korunumu: $\\vec{v}_1 + \\vec{v}_1' = \\vec{v}_2 + \\vec{v}_2'$" },
    { id: 'fz10', ders: 'AYT FİZİK', baslik: "Elektriksel Kuvvet ve Alan", formul: "Elektriksel kuvvet: $F = k \\frac{q_1 q_2}{d^2}$\nElektrik alan: $E = \\frac{F}{q} = k \\frac{q}{d^2}$" },
    { id: 'fz11', ders: 'AYT FİZİK', baslik: "Elektriksel Potansiyel ve İş", formul: "Elektriksel potansiyel: $V = k \\frac{q}{d}$\nElektriksel potansiyel enerji: $E_p = k \\frac{q_1 q_2}{d}$\nElektriksel iş: $W = q \\cdot \\Delta V$" },
    { id: 'fz12', ders: 'AYT FİZİK', baslik: "Paralel Levhalar ve Sığa", formul: "Levhalar arası elektrik alan: $E = \\frac{V}{d}$\nYüke etkiyen kuvvet: $F = \\frac{q V}{d}$\nKarşı levhaya çarpma kinetik enerjisi: $E_k = q \\cdot V$\nSığa (kapasite): $C = \\frac{Q}{V} = \\varepsilon_0 \\frac{A}{d}$\nSığaçta depolanan enerji: $E_{\\text{sığa}} = \\frac{1}{2} C V^2 = \\frac{Q^2}{2C}$" },
    { id: 'fz13', ders: 'AYT FİZİK', baslik: "Manyetik Alan (B)", formul: "Düz telin manyetik alanı: $B = \\frac{2 k i}{d}$\nÇember telin merkezindeki manyetik alan: $B = \\frac{2 k \\pi i}{r}$\nAkım makarasının (bobin) manyetik alanı: $B = \\frac{4 k \\pi N i}{L}$" },
    { id: 'fz14', ders: 'AYT FİZİK', baslik: "Manyetik Kuvvet ve Tork", formul: "Akım geçen tele etkiyen kuvvet: $F = B \\cdot i \\cdot l \\cdot \\sin\\alpha$\nHareketli yüke etkiyen kuvvet: $F = q \\cdot v \\cdot B \\cdot \\sin\\alpha$\nYörünge yarıçapı: $r = \\frac{m v}{q B}$\nAkım çerçevesine etkiyen tork: $\\tau = B \\cdot i \\cdot A \\cdot N$" },
    { id: 'fz15', ders: 'AYT FİZİK', baslik: "İndüksiyon ve Öz İndüksiyon", formul: "Manyetik akı: $\\Phi = B \\cdot A \\cdot \\cos\\alpha$\nİndüksiyon EMK'sı: $\\varepsilon = -\\frac{\\Delta \\Phi}{\\Delta t}$\nHareketli telde oluşan EMK: $\\varepsilon = B \\cdot v \\cdot l$\nBir ucu sabit dönen telde oluşan EMK: $\\varepsilon = \\frac{1}{2} B \\omega l^2$\nÖz indüksiyon EMK'sı: $\\varepsilon_{\\text{öz}} = -L \\frac{\\Delta i}{\\Delta t}$" },
    { id: 'fz16', ders: 'AYT FİZİK', baslik: "Alternatif Akım ve Transformatörler", formul: "Etkin gerilim ve akım: $V_{\\text{etkin}} = \\frac{V_{\\text{max}}}{\\sqrt{2}}$\n$i_{\\text{etkin}} = \\frac{i_{\\text{max}}}{\\sqrt{2}}$\nİndüktif reaktans (bobin) ve kapasitif reaktans (sığaç): $X_L = \\omega L = 2\\pi f L$\n$X_C = \\frac{1}{\\omega C} = \\frac{1}{2\\pi f C}$\nEmpedans (eşdeğer direnç): $Z = \\sqrt{R^2 + (X_L - X_C)^2}$\nRezonans şartı: $X_L = X_C \\implies Z = R$\nTransformatör gerilim oranı ve verim: $\\frac{V_p}{V_s} = \\frac{N_p}{N_s}$\n$\\text{Verim} = \\frac{V_s \\cdot i_s}{V_p \\cdot i_p}$" },
    { id: 'fz17', ders: 'AYT FİZİK', baslik: "Düzgün Çembersel Hareket", formul: "Periyot-frekans ilişkisi: $T \\cdot f = 1$\nAçısal hız ve çizgisel hız: $\\omega = \\frac{2\\pi}{T} = 2\\pi f$\n$v = \\omega \\cdot r = \\frac{2\\pi r}{T}$\nMerkezcil ivme ve merkezcil kuvvet: $a_m = \\frac{v^2}{r} = \\omega^2 r$\n$F_m = m \\frac{v^2}{r} = m \\omega^2 r$\nYatay viraj maksimum emniyetli hız: $v_{\\text{max}} = \\sqrt{k g r}$\nEğimli viraj emniyetli hız: $v = \\sqrt{g r \\tan\\alpha}$" },
    { id: 'fz18', ders: 'AYT FİZİK', baslik: "Dönme, Yuvarlanma ve Açısal Momentum", formul: "Eylemsizlik momenti: $I = \\sum m r^2$\nDönme kinetik enerjisi: $E_{\\text{dönme}} = \\frac{1}{2} I \\omega^2$\nDönerek öteleme toplam kinetik enerjisi: $E_{\\text{toplam}} = \\frac{1}{2} m v^2 + \\frac{1}{2} I \\omega^2$\nAçısal momentum ve net tork ilişkisi: $L = I \\cdot \\omega = m \\cdot v \\cdot r$\n$\\tau_{\\text{net}} = I \\cdot \\alpha = \\frac{\\Delta L}{\\Delta t}$" },
    { id: 'fz19', ders: 'AYT FİZİK', baslik: "Kütle Çekim ve Kepler Yasaları", formul: "Kütle çekim kuvveti ve çekim ivmesi: $F = G \\frac{m_1 m_2}{d^2}$\n$g = G \\frac{M}{r^2}$\nKütle çekim potansiyel enerjisi: $E_p = -G \\frac{M m}{r}$\nUydu toplam enerjisi ve bağlanma enerjisi: $E_{\\text{toplam}} = -G \\frac{M m}{2r}$\n$E_{\\text{bağlanma}} = +G \\frac{M m}{2r}$\nUydu yörünge hızı ve kurtulma hızı: $v_{\\text{yörünge}} = \\sqrt{\\frac{G M}{r}}$\n$v_{\\text{kurtulma}} = \\sqrt{\\frac{2 G M}{r}}$\nKepler periyotlar yasası: $\\frac{R_{\\text{ort}}^3}{T^2} = \\text{sabit}$" },
    { id: 'fz20', ders: 'AYT FİZİK', baslik: "Basit Harmonik Hareket", formul: "Konum, anlık hız ve maksimum hız: $x = r \\sin(\\omega t)$\n$v = \\omega \\sqrt{r^2 - x^2}$\n$v_{\\text{max}} = \\omega r$\nGeri çağırıcı kuvvet ve ivme: $F = -m \\omega^2 x \\; (F_{\\text{max}} = m \\omega^2 r)$\n$a = -\\omega^2 x \\; (a_{\\text{max}} = \\omega^2 r)$\nYay sarkacı periyodu: $T_{\\text{yay}} = 2\\pi \\sqrt{\\frac{m}{k}}$\nSeri yay: $\\frac{1}{k_{\\text{eş}}} = \\frac{1}{k_1} + \\frac{1}{k_2}$\nParalel yay: $k_{\\text{eş}} = k_1 + k_2$\nBasit sarkaç periyodu: $T_{\\text{sarkaç}} = 2\\pi \\sqrt{\\frac{L}{g}}$" },
    { id: 'fz21', ders: 'AYT FİZİK', baslik: "Su Dalgalarında Girişim (Yol Farkı)", formul: "Dalga katarı: $\\Delta s = n \\lambda$\nDüğüm çizgisi: $\\Delta s = \\left(n - \\frac{1}{2}\\right)\\lambda$" },
    { id: 'fz22', ders: 'AYT FİZİK', baslik: "Çift Yarıkta Girişim (Young)", formul: "Saçak genişliği: $\\Delta x = \\frac{L \\cdot \\lambda}{d \\cdot n}$\nAydınlık saçak: $\\Delta s = n \\lambda$\nKaranlık saçak: $\\Delta s = \\left(n - \\frac{1}{2}\\right)\\lambda$" },
    { id: 'fz23', ders: 'AYT FİZİK', baslik: "Tek Yarıkta Kırınım", formul: "Saçak genişliği: $\\Delta x = \\frac{L \\cdot \\lambda}{w \\cdot n}$\nAydınlık saçak: $\\Delta s = \\left(n + \\frac{1}{2}\\right)\\lambda$\nKaranlık saçak: $\\Delta s = n \\lambda$" },
    { id: 'fz24', ders: 'AYT FİZİK', baslik: "Doppler Olayı (Algılanan Frekans)", formul: "$f_{\\text{algılanan}} = f_{\\text{kaynak}} \\cdot \\frac{v \\pm v_{\\text{gözlemci}}}{v \\mp v_{\\text{kaynak}}}$" },
    { id: 'fz25', ders: 'AYT FİZİK', baslik: "Elektromanyetik Dalgalar", formul: "Işık hızı: $c = \\lambda \\cdot f$\nElektrik-manyetik alan oranı: $\\frac{E}{B} = c$" },
    { id: 'fz26', ders: 'AYT FİZİK', baslik: "Bohr Atom Modeli", formul: "Yörünge yarıçapı: $r_n = a_0 \\frac{n^2}{Z}$\nEnerji seviyeleri: $E_n = -13{,}6 \\frac{Z^2}{n^2}\\text{ eV}$\nAçısal momentum: $L_n = n \\frac{h}{2\\pi}$\nSalınan foton enerjisi: $E_{\\text{foton}} = E_{\\text{üst}} - E_{\\text{alt}} = \\frac{h c}{\\lambda}$" },
    { id: 'fz27', ders: 'AYT FİZİK', baslik: "Radyoaktivite ve Kara Cisim Işıması", formul: "Yarılanma sonrası kalan çekirdek: $N = N_0 \\left(\\frac{1}{2}\\right)^n$\nWien kayma yasası: $\\lambda_{\\text{max}} \\cdot T = \\text{sabit}$" },
    { id: 'fz28', ders: 'AYT FİZİK', baslik: "Fotoelektrik Olay", formul: "Foton enerjisi: $E_{\\text{foton}} = h \\cdot f = \\frac{h c}{\\lambda}$\nFotoelektrik denklemi: $E_{\\text{foton}} = E_{\\text{bağlanma}} + E_{k,\\text{max}}$\nEşik (bağlanma) enerjisi: $E_{\\text{bağlanma}} = h \\cdot f_0 = \\frac{h c}{\\lambda_0}$\nKesme gerilimi ilişkisi: $E_{k,\\text{max}} = e \\cdot V_{\\text{kesme}}$" },
    { id: 'fz29', ders: 'AYT FİZİK', baslik: "Compton Saçılması ve De Broglie", formul: "Enerji korunumu: $E_{\\text{gelen}} = E_{\\text{saçılan}} + E_{k,\\text{elektron}}$\nDalga boyu artışı: $\\Delta \\lambda = \\lambda' - \\lambda = \\frac{h}{m_e c}(1 - \\cos\\theta)$\nDe Broglie madde dalga boyu: $\\lambda = \\frac{h}{P} = \\frac{h}{m v}$" },
    { id: "mt1", ders: "AYT MATEMATİK", konu: "Çarpanlara Ayırma ve Özdeşlikler", baslik: "İki Kare Farkı", formul: "$a^2 - b^2 = (a - b)(a + b)$" },
    { id: "mt2", ders: "AYT MATEMATİK", konu: "Çarpanlara Ayırma ve Özdeşlikler", baslik: "Tam Kare Açılımları", formul: "$(a \\pm b)^2 = a^2 \\pm 2ab + b^2$\nÜç terimli tam kare: $(a + b + c)^2 = a^2 + b^2 + c^2 + 2(ab + ac + bc)$" },
    { id: "mt3", ders: "AYT MATEMATİK", konu: "Çarpanlara Ayırma ve Özdeşlikler", baslik: "İki Küp Toplamı ve Farkı", formul: "$a^3 + b^3 = (a + b)(a^2 - ab + b^2)$\n$a^3 - b^3 = (a - b)(a^2 + ab + b^2)$" },
    { id: "mt4", ders: "AYT MATEMATİK", konu: "Çarpanlara Ayırma ve Özdeşlikler", baslik: "Küp Açılımları", formul: "$(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$\n$= a^3 + b^3 + 3ab(a + b)$\n$(a - b)^3 = a^3 - 3a^2b + 3ab^2 - b^3$\n$= a^3 - b^3 - 3ab(a - b)$" },
    { id: "mt5", ders: "AYT MATEMATİK", konu: "Fonksiyonlar ve Dönüşümler", baslik: "Ortalama Değişim Hızı ([a, b] aralığında)", formul: "$m = \\frac{f(b) - f(a)}{b - a}$" },
    { id: "mt6", ders: "AYT MATEMATİK", konu: "Fonksiyonlar ve Dönüşümler", baslik: "Tek ve Çift Fonksiyon Şartları", formul: "Çift fonksiyon (y eksenine göre simetrik): $f(-x) = f(x)$\nTek fonksiyon (orijine göre simetrik): $f(-x) = -f(x)$" },
    { id: "mt7", ders: "AYT MATEMATİK", konu: "Fonksiyonlar ve Dönüşümler", baslik: "Bileşke ve Ters Fonksiyon", formul: "$(f \\circ g)(x) = f(g(x))$\nBileşkenin tersi: $(f \\circ g)^{-1}(x) = (g^{-1} \\circ f^{-1})(x)$" },
    { id: "mt8", ders: "AYT MATEMATİK", konu: "Fonksiyonlar ve Dönüşümler", baslik: "Doğrusal Fonksiyonun Tersi", formul: "$f(x) = ax + b \\implies f^{-1}(x) = \\frac{x - b}{a}$" },
    { id: "mt9", ders: "AYT MATEMATİK", konu: "Fonksiyonlar ve Dönüşümler", baslik: "Kesirli (Rasyonel) Fonksiyonun Tersi", formul: "$f(x) = \\frac{ax + b}{cx + d} \\implies f^{-1}(x) = \\frac{-dx + b}{cx - a}$" },
    { id: "mt10", ders: "AYT MATEMATİK", konu: "Fonksiyonlar ve Dönüşümler", baslik: "Grafik Öteleme ve Simetri", formul: "Düşey öteleme: $y = f(x) \\pm k$ (k birim yukarı / aşağı)\nYatay öteleme: $y = f(x \\mp k)$ (k birim sağa / sola)\nx eksenine göre simetri: $y = -f(x)$\ny eksenine göre simetri: $y = f(-x)$\nOrijine göre simetri: $y = -f(-x)$" },
    { id: "mt11", ders: "AYT MATEMATİK", konu: "Polinomlar", baslik: "Polinom Olma Şartı", formul: "$P(x) = a_n x^n + a_{n-1} x^{n-1} + \\dots + a_0$ ifadesinde tüm x üsleri doğal sayı olmalıdır ($n \\in \\mathbb{N}$)." },
    { id: "mt12", ders: "AYT MATEMATİK", konu: "Polinomlar", baslik: "Bölme Özdeşliği", formul: "$P(x) = B(x) \\cdot Q(x) + K(x)$ ve kalan derecesi şartı $\\text{der}[K(x)] < \\text{der}[B(x)]$" },
    { id: "mt13", ders: "AYT MATEMATİK", konu: "Polinomlar", baslik: "Kalan Bulma Kuralı", formul: "$P(x)$ polinomunun $(ax + b)$ ile bölümünden kalan $P\\left(-\\frac{b}{a}\\right)$ değeridir." },
    { id: "mt14", ders: "AYT MATEMATİK", konu: "Polinomlar", baslik: "Katsayılar Toplamı ve Sabit Terim", formul: "Katsayılar toplamı: $P(1)$\nSabit terim: $P(0)$" },
    { id: "mt15", ders: "AYT MATEMATİK", konu: "Polinomlar", baslik: "Çift ve Tek Dereceli Terimlerin Katsayıları Toplamı", formul: "Çift dereceli terimler toplamı: $\\frac{P(1) + P(-1)}{2}$\nTek dereceli terimler toplamı: $\\frac{P(1) - P(-1)}{2}$" },
    { id: "mt16", ders: "AYT MATEMATİK", konu: "Polinomlar", baslik: "Polinom Dereceleri (der[P] = m, der[Q] = n ve m > n için)", formul: "Toplama/çıkarma derecesi: $\\text{der}[P(x) \\pm Q(x)] = m$\nÇarpım ve bölüm derecesi: $\\text{der}[P(x) \\cdot Q(x)] = m + n$\n$\\text{der}\\left[\\frac{P(x)}{Q(x)}\\right] = m - n$\nKuvvet ve bileşke derecesi: $\\text{der}[P^k(x)] = k \\cdot m$\n$\\text{der}[P(x^k)] = k \\cdot m$\n$\\text{der}[P(Q(x))] = m \\cdot n$" },
    { id: "mt17", ders: "AYT MATEMATİK", konu: "İkinci Dereceden Denklemler ve Karmaşık Sayılar", baslik: "Diskriminant (Δ) ve Kök Formülü", formul: "$ax^2 + bx + c = 0$ ($a \\neq 0$) için $\\Delta = b^2 - 4ac$\nKökler: $x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$" },
    { id: "mt18", ders: "AYT MATEMATİK", konu: "İkinci Dereceden Denklemler ve Karmaşık Sayılar", baslik: "Diskriminant Kök Durumları", formul: "$\\Delta > 0$ ⇒ İki farklı reel kök vardır.\n$\\Delta = 0$ ⇒ Çakışık (eşit) iki reel kök vardır (ifade tam karedir).\n$\\Delta < 0$ ⇒ Reel kök yoktur (birbirinin eşleniği iki karmaşık kök vardır)." },
    { id: "mt19", ders: "AYT MATEMATİK", konu: "İkinci Dereceden Denklemler ve Karmaşık Sayılar", baslik: "Kök-Katsayı İlişkileri (Vieta Formülleri)", formul: "Kökler toplamı: $x_1 + x_2 = -\\frac{b}{a}$\nKökler çarpımı: $x_1 \\cdot x_2 = \\frac{c}{a}$\nKökler farkı mutlak değeri: $\\vert{}x_1 - x_2\\vert{} = \\frac{\\sqrt{\\Delta}}{\\vert{}a\\vert{}}$" },
    { id: "mt20", ders: "AYT MATEMATİK", konu: "İkinci Dereceden Denklemler ve Karmaşık Sayılar", baslik: "Kökleri Bilinen Denklemi Kurma", formul: "$x^2 - T x + Ç = 0$ ($T = x_1 + x_2$, $Ç = x_1 \\cdot x_2$)" },
    { id: "mt21", ders: "AYT MATEMATİK", konu: "İkinci Dereceden Denklemler ve Karmaşık Sayılar", baslik: "Simetrik Kök Şartı (x₁ = −x₂)", formul: "$b = 0$ ve $\\frac{c}{a} < 0$" },
    { id: "mt22", ders: "AYT MATEMATİK", konu: "İkinci Dereceden Denklemler ve Karmaşık Sayılar", baslik: "Karmaşık Sayılar (i² = −1)", formul: "Sanal birim kuvvetleri: $i^{4k} = 1, \\quad i^{4k+1} = i, \\quad i^{4k+2} = -1, \\quad i^{4k+3} = -i$\nEşlenik ve eşlenik çarpımı: $z = a + bi \\implies \\bar{z} = a - bi$\n$z \\cdot \\bar{z} = a^2 + b^2$" },
    { id: "mt23", ders: "AYT MATEMATİK", konu: "İkinci Dereceden Eşitsizlikler", baslik: "İşaret Tablosu Kuralı", formul: "En sağdan baş katsayının (a) işaretiyle başlanır; tek katlı kökte işaret değişir, çift katlı kökte (tam kare çarpan) işaret değişmez." },
    { id: "mt24", ders: "AYT MATEMATİK", konu: "İkinci Dereceden Eşitsizlikler", baslik: "Daimi Pozitif / Negatif Olma Şartları (∀x∈ℝ için ax² + bx + c)", formul: "Daimi pozitif ($> 0$): $a > 0$ ve $\\Delta < 0$\nDaimi negatif ($< 0$): $a < 0$ ve $\\Delta < 0$" },
    { id: "mt25", ders: "AYT MATEMATİK", konu: "Parabol (İkinci Dereceden Fonksiyonlar)", baslik: "Tepe Noktası Koordinatları T(r, k)", formul: "Simetri ekseni (apsis): $r = -\\frac{b}{2a} = \\frac{x_1 + x_2}{2}$\nTepe noktası ordinatı (en büyük / en küçük değer): $k = f(r) = \\frac{4ac - b^2}{4a}$" },
    { id: "mt26", ders: "AYT MATEMATİK", konu: "Parabol (İkinci Dereceden Fonksiyonlar)", baslik: "Parabol Denklemi Kurma", formul: "Tepe noktası biliniyorsa: $f(x) = a(x - r)^2 + k$\nx eksenini kestiği noktalar biliniyorsa: $f(x) = a(x - x_1)(x - x_2)$" },
    { id: "mt27", ders: "AYT MATEMATİK", konu: "Parabol (İkinci Dereceden Fonksiyonlar)", baslik: "Doğru ile Parabolün Durumu (ortak denklemin Δ değerine göre)", formul: "$\\Delta_{\\text{ortak}} > 0$ ⇒ İki farklı noktada kesişirler.\n$\\Delta_{\\text{ortak}} = 0$ ⇒ Doğru parabole teğettir.\n$\\Delta_{\\text{ortak}} < 0$ ⇒ Kesişmezler." },
    { id: "mt28", ders: "AYT MATEMATİK", konu: "Permütasyon, Kombinasyon, Binom ve Olasılık", baslik: "Permütasyon (Sıralama)", formul: "$P(n, r) = \\frac{n!}{(n - r)!}$\nTekrarlı permütasyon: $\\frac{n!}{n_1! \\cdot n_2! \\cdot \\dots \\cdot n_k!}$" },
    { id: "mt29", ders: "AYT MATEMATİK", konu: "Permütasyon, Kombinasyon, Binom ve Olasılık", baslik: "Kombinasyon (Seçme)", formul: "$C(n, r) = \\binom{n}{r} = \\frac{n!}{(n - r)! \\cdot r!}$" },
    { id: "mt30", ders: "AYT MATEMATİK", konu: "Permütasyon, Kombinasyon, Binom ve Olasılık", baslik: "Kombinasyon Özellikleri", formul: "$\\binom{n}{r} = \\binom{n}{n-r}$\nAlt kümeler toplamı: $\\binom{n}{0} + \\binom{n}{1} + \\dots + \\binom{n}{n} = 2^n$\nPascal özdeşliği: $\\binom{n}{r} + \\binom{n}{r+1} = \\binom{n+1}{r+1}$" },
    { id: "mt31", ders: "AYT MATEMATİK", konu: "Permütasyon, Kombinasyon, Binom ve Olasılık", baslik: "Binom Açılımı Genel Terim", formul: "$(x + y)^n$ açılımında baştan $(r + 1)$. terim: $T_{r+1} = \\binom{n}{r} \\cdot x^{n-r} \\cdot y^r$ (toplam terim sayısı $= n + 1$)" },
    { id: "mt32", ders: "AYT MATEMATİK", konu: "Permütasyon, Kombinasyon, Binom ve Olasılık", baslik: "Olasılık Kuralları", formul: "Olay olasılığı ve tümleyeni: $P(A) = \\frac{s(A)}{s(E)}$ ve $P(A) + P(A') = 1$\nBirleşim olasılığı: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$\nBağımsız olaylar: $P(A \\cap B) = P(A) \\cdot P(B)$\nKoşullu olasılık (B bilindiğinde A olasılığı): $P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}$" },
    { id: "mt33", ders: "AYT MATEMATİK", konu: "Trigonometri", baslik: "Derece - Radyan Dönüşümü", formul: "$\\frac{D}{180} = \\frac{R}{\\pi}$" },
    { id: "mt34", ders: "AYT MATEMATİK", konu: "Trigonometri", baslik: "Temel Özdeşlikler", formul: "Pisagor özdeşliği: $\\sin^2 x + \\cos^2 x = 1$\nTanjant ve kotanjant: $\\tan x = \\frac{\\sin x}{\\cos x}, \\quad \\cot x = \\frac{\\cos x}{\\sin x}$\n$\\tan x \\cdot \\cot x = 1$\nSekant ve kosekant: $\\sec x = \\frac{1}{\\cos x}, \\quad \\csc x = \\frac{1}{\\sin x}$\n$1 + \\tan^2 x = \\sec^2 x, \\quad 1 + \\cot^2 x = \\csc^2 x$" },
    { id: "mt35", ders: "AYT MATEMATİK", konu: "Trigonometri", baslik: "Bölge İşaretleri ve İndirgeme Kuralları", formul: "İşaret sırası (I, II, III, IV. bölgeler):\n$\\sin$: $(+, +, -, -)$\n$\\cos$: $(+, -, -, +)$\n$\\tan$ ve $\\cot$: $(+, -, +, -)$\n$\\pi$ ve $2\\pi$ kullanıldığında fonksiyon adı değişmez.\n$\\frac{\\pi}{2}$ ve $\\frac{3\\pi}{2}$ kullanıldığında isim değişir: $\\sin \\leftrightarrow \\cos, \\ \\tan \\leftrightarrow \\cot$\nTümler açı: $x + y = 90^\\circ \\implies \\sin x = \\cos y, \\ \\tan x = \\cot y$" },
    { id: "mt36", ders: "AYT MATEMATİK", konu: "Trigonometri", baslik: "Kosinüs ve Sinüs Teoremleri", formul: "ABC üçgeninde:\nKosinüs teoremi: $a^2 = b^2 + c^2 - 2bc \\cos A$\nSinüs teoremi: $\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R$\nR: çevrel çember yarıçapı\nSinüslü alan formülü: $\\text{Alan}(ABC) = \\frac{1}{2} \\cdot b \\cdot c \\cdot \\sin A$" },
    { id: "mt37", ders: "AYT MATEMATİK", konu: "Trigonometri", baslik: "Toplam - Fark Formülleri", formul: "Sinüs: $\\sin(a \\pm b) = \\sin a \\cos b \\pm \\cos a \\sin b$\nKosinüs: $\\cos(a \\pm b) = \\cos a \\cos b \\mp \\sin a \\sin b$\nTanjant: $\\tan(a \\pm b) = \\frac{\\tan a \\pm \\tan b}{1 \\mp \\tan a \\tan b}$\nKotanjant: $\\cot(a \\pm b) = \\frac{\\cot a \\cot b \\mp 1}{\\cot b \\pm \\cot a}$" },
    { id: "mt38", ders: "AYT MATEMATİK", konu: "Trigonometri", baslik: "İki Kat (Yarım) Açı Formülleri", formul: "Sinüs: $\\sin(2x) = 2 \\sin x \\cos x$\nKosinüs: $\\cos(2x) = \\cos^2 x - \\sin^2 x$\n$\\cos(2x) = 2\\cos^2 x - 1 = 1 - 2\\sin^2 x$\nTanjant: $\\tan(2x) = \\frac{2 \\tan x}{1 - \\tan^2 x}$" },
    { id: "mt39", ders: "AYT MATEMATİK", konu: "Trigonometri", baslik: "Periyot Formülleri", formul: "Fonksiyon: $f(x) = a \\cdot \\text{trig}^n(bx + c) + d$\n$\\sin$ ve $\\cos$, $n$ tek ise: $T = \\frac{2\\pi}{\\vert{}b\\vert{}}$\n$\\sin$ ve $\\cos$, $n$ çift ise: $T = \\frac{\\pi}{\\vert{}b\\vert{}}$\n$\\tan$ ve $\\cot$ ($n$ tek veya çift): $T = \\frac{\\pi}{\\vert{}b\\vert{}}$" },
    { id: "mt40", ders: "AYT MATEMATİK", konu: "Trigonometri", baslik: "Ters Trigonometrik Fonksiyonların Değer Aralıkları", formul: "$\\arcsin x \\in \\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$\n$\\arccos x \\in [0, \\pi]$\n$\\arctan x \\in \\left(-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right)$\n$\\operatorname{arccot} x \\in (0, \\pi)$" },
    { id: "mt41", ders: "AYT MATEMATİK", konu: "Trigonometri", baslik: "Trigonometrik Denklemler", formul: "$k \\in \\mathbb{Z}$ için:\nSinüs: $\\sin x = \\sin \\alpha \\implies$\n$x = \\alpha + 2k\\pi$ veya $x = (\\pi - \\alpha) + 2k\\pi$\nKosinüs: $\\cos x = \\cos \\alpha \\implies$\n$x = \\alpha + 2k\\pi$ veya $x = -\\alpha + 2k\\pi$\nTanjant: $\\tan x = \\tan \\alpha \\implies x = \\alpha + k\\pi$\nKotanjant: $\\cot x = \\cot \\alpha \\implies x = \\alpha + k\\pi$\nLineer denklem: $a \\sin x + b \\cos x = c$ çözümlü olması için $a^2 + b^2 \\ge c^2$ olmalıdır." },
    { id: "mt42", ders: "AYT MATEMATİK", konu: "Logaritma", baslik: "Tanım ve En Geniş Tanım Kümesi", formul: "$y = a^x \\iff x = \\log_a y$\nŞart: $a > 0, \\ a \\neq 1, \\ y > 0$" },
    { id: "mt43", ders: "AYT MATEMATİK", konu: "Logaritma", baslik: "Temel Özellikler ve Özel Tabanlar", formul: "Temel değerler: $\\log_a 1 = 0, \\quad \\log_a a = 1$\n$\\log_a(a^x) = x, \\quad a^{\\log_a x} = x$\nOnluk logaritma: $\\log_{10} x = \\log x$\nDoğal logaritma: $\\log_e x = \\ln x$, $e \\approx 2{,}718$" },
    { id: "mt44", ders: "AYT MATEMATİK", konu: "Logaritma", baslik: "Çarpım, Bölüm ve Kuvvet Kuralları", formul: "Çarpım: $\\log_a(x \\cdot y) = \\log_a x + \\log_a y$\nBölüm: $\\log_a\\left(\\frac{x}{y}\\right) = \\log_a x - \\log_a y$\nÜs başa iner: $\\log_a(x^n) = n \\cdot \\log_a x$\nTaban ve sayının üssü: $\\log_{a^m}(x^n) = \\frac{n}{m} \\log_a x$" },
    { id: "mt45", ders: "AYT MATEMATİK", konu: "Logaritma", baslik: "Taban Değiştirme ve Zincir Kuralı", formul: "Taban değiştirme: $\\log_a b = \\frac{\\log_c b}{\\log_c a}$\nÇarpmaya göre tersi: $\\log_a b = \\frac{1}{\\log_b a}$\nZincir kuralı: $\\log_a b \\cdot \\log_b c = \\log_a c$\nÜstteki logaritma yer değiştirme: $a^{\\log_b c} = c^{\\log_b a}$" },
    { id: "mt46", ders: "AYT MATEMATİK", konu: "Logaritma", baslik: "Logaritmik Eşitsizlikler", formul: "Eşitsizlik: $\\log_a f(x) > \\log_a g(x)$\n$a > 1$ ise (artan, yön değişmez): $f(x) > g(x) > 0$\n$0 < a < 1$ ise (azalan, yön değişir): $0 < f(x) < g(x)$" },
    { id: "mt47", ders: "AYT MATEMATİK", konu: "Diziler", baslik: "Genel Terim ve İlk n Terim Toplamı (Sₙ) İlişkisi", formul: "$a_1 = S_1$\n$n \\ge 2$ için: $a_n = S_n - S_{n-1}$" },
    { id: "mt48", ders: "AYT MATEMATİK", konu: "Diziler", baslik: "Sabit Dizi Şartı", formul: "$a_n = \\frac{an + b}{cn + d}$ sabit dizi ise: $\\frac{a}{c} = \\frac{b}{d}$" },
    { id: "mt49", ders: "AYT MATEMATİK", konu: "Diziler", baslik: "Aritmetik Dizi (Ortak Fark d)", formul: "Genel terim: $a_n = a_1 + (n - 1)d$\nİki terim arası: $a_n = a_p + (n - p)d$\nOrta terim: $a_n = \\frac{a_{n-k} + a_{n+k}}{2}$\nEşit uzaklık: $n + m = p + k \\implies a_n + a_m = a_p + a_k$\nİlk n terim toplamı: $S_n = \\frac{n}{2}(a_1 + a_n)$\n$S_n = \\frac{n}{2}[2a_1 + (n - 1)d]$" },
    { id: "mt50", ders: "AYT MATEMATİK", konu: "Diziler", baslik: "Geometrik Dizi (Ortak Çarpan r)", formul: "Genel terim: $a_n = a_1 \\cdot r^{n-1}$\nİki terim arası: $a_n = a_p \\cdot r^{n-p}$\nOrta terim: $a_n^2 = a_{n-k} \\cdot a_{n+k}$\nEşit uzaklık: $n + m = p + k \\implies a_n \\cdot a_m = a_p \\cdot a_k$\nİlk n terim toplamı: $S_n = a_1 \\cdot \\frac{1 - r^n}{1 - r}$ ($r \\neq 1$)" },
    { id: "mt51", ders: "AYT MATEMATİK", konu: "Diziler", baslik: "Özel Toplam Formülleri", formul: "Ardışık sayılar: $1 + 2 + 3 + \\dots + n = \\frac{n(n + 1)}{2}$\nArdışık kareler: $1^2 + 2^2 + 3^2 + \\dots + n^2 = \\frac{n(n + 1)(2n + 1)}{6}$" },
    { id: "mt52", ders: "AYT MATEMATİK", konu: "Limit ve Süreklilik", baslik: "Limitin Varlık Şartı", formul: "$\\lim_{x \\to a^-} f(x) = \\lim_{x \\to a^+} f(x) = L$\n$\\iff \\lim_{x \\to a} f(x) = L$" },
    { id: "mt53", ders: "AYT MATEMATİK", konu: "Limit ve Süreklilik", baslik: "0/0 Belirsizliği Çözüm Yolları", formul: "Pay ve payda çarpanlarına ayrılır ya da köklü ifade varsa eşleniği ile çarpılır.\nL'Hôpital Kuralı: $\\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f'(x)}{g'(x)}$" },
    { id: "mt54", ders: "AYT MATEMATİK", konu: "Limit ve Süreklilik", baslik: "Süreklilik Şartı", formul: "$x = a$ noktasında süreklilik için:\n$f(a)$ tanımlı olmalıdır.\n$\\lim_{x \\to a^-} f(x) = \\lim_{x \\to a^+} f(x) = f(a)$ eşitliği sağlanmalıdır." },
    { id: "mt55", ders: "AYT MATEMATİK", konu: "Türev", baslik: "Türevin Limit Tanımı (Anlık Değişim Hızı)", formul: "$f'(a) = \\lim_{h \\to 0} \\frac{f(a + h) - f(a)}{h}$\n$f'(a) = \\lim_{x \\to a} \\frac{f(x) - f(a)}{x - a}$" },
    { id: "mt56", ders: "AYT MATEMATİK", konu: "Türev", baslik: "Türevlenebilirlik Şartı", formul: "Bir noktada türev varsa fonksiyon o noktada kesinlikle süreklidir.\nSağdan ve soldan türevler eşit olmalıdır: $f'(a^-) = f'(a^+)$\nKırılma (sivri uç) noktalarında türev yoktur." },
    { id: "mt57", ders: "AYT MATEMATİK", konu: "Türev", baslik: "Temel Türev Alma Kuralları", formul: "Sabit ve kuvvet: $(c)' = 0, \\quad (x^n)' = n \\cdot x^{n-1}$\nKöklü: $(\\sqrt{x})' = \\frac{1}{2\\sqrt{x}}, \\quad (\\sqrt{u})' = \\frac{u'}{2\\sqrt{u}}$\nÇarpım: $(f \\cdot g)' = f' \\cdot g + f \\cdot g'$\nBölüm: $\\left(\\frac{f}{g}\\right)' = \\frac{f' \\cdot g - f \\cdot g'}{g^2}$\nZincir kuralı: $(f \\circ g)'(x) = f'(g(x)) \\cdot g'(x)$\nKuvvet zinciri: $(u^n)' = n \\cdot u^{n-1} \\cdot u'$\nParametrik fonksiyon: $\\frac{dy}{dx} = \\frac{dy/dt}{dx/dt}$\nTers fonksiyon: $f(a) = b \\implies (f^{-1})'(b) = \\frac{1}{f'(a)}$" },
    { id: "mt58", ders: "AYT MATEMATİK", konu: "Türev", baslik: "Türevin Geometrik Yorumu", formul: "$A(x_0, y_0)$ noktasında:\nTeğet eğimi: $m_{\\text{teğet}} = f'(x_0)$\nNormal eğimi: $m_{\\text{normal}} = -\\frac{1}{f'(x_0)}$\nTeğet doğrusu: $y - y_0 = f'(x_0)(x - x_0)$" },
    { id: "mt59", ders: "AYT MATEMATİK", konu: "Türev", baslik: "Artan - Azalanlık ve Ekstremum Noktaları", formul: "Artan aralık: $f'(x) > 0$\nAzalan aralık: $f'(x) < 0$\nYerel ekstremum (maksimum/minimum): türevin işaret değiştirdiği noktalardır.\nFonksiyon o noktada türevli ise: $f'(x_0) = 0$" },
    { id: "mt60", ders: "AYT MATEMATİK", konu: "Türev", baslik: "Türevin Fiziksel Yorumu", formul: "Konum: $s(t)$\nHız: $v(t) = s'(t)$\nİvme: $a(t) = v'(t) = s''(t)$" },
    { id: "mt61", ders: "AYT MATEMATİK", konu: "İntegral", baslik: "Belirsiz İntegral ve Diferansiyel İlişkisi", formul: "Tanım: $\\int f(x)\\,dx = F(x) + c \\iff F'(x) = f(x)$\n$d\\left(\\int f(x)\\,dx\\right) = f(x)\\,dx$\n$\\frac{d}{dx}\\left(\\int f(x)\\,dx\\right) = f(x)$\n$\\int d(f(x)) = f(x) + c$" },
    { id: "mt62", ders: "AYT MATEMATİK", konu: "İntegral", baslik: "Temel İntegral Kuralları", formul: "Sabit: $\\int a\\,dx = ax + c$\nKuvvet kuralı: $\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + c$ ($n \\neq -1$)\nDoğrusal içli kuvvet: $\\int (ax + b)^n\\,dx = \\frac{(ax + b)^{n+1}}{a(n+1)} + c$" },
    { id: "mt63", ders: "AYT MATEMATİK", konu: "İntegral", baslik: "Değişken Değiştirme Yöntemi", formul: "$\\int f(g(x)) \\cdot g'(x)\\,dx$ integralinde $g(x) = u$ dönüşümü yapılır.\n$g'(x)\\,dx = du$ olur ve integral $\\int f(u)\\,du$ haline gelir." },
    { id: "mt64", ders: "AYT MATEMATİK", konu: "İntegral", baslik: "Belirli İntegral ve Özellikleri", formul: "Newton-Leibniz: $\\int_a^b f(x)\\,dx = F(b) - F(a)$\n$\\int_a^a f(x)\\,dx = 0$\n$\\int_a^b f(x)\\,dx = -\\int_b^a f(x)\\,dx$\n$\\int_a^b f(x)\\,dx = \\int_a^c f(x)\\,dx + \\int_c^b f(x)\\,dx$\n$[-a, a]$ aralığında, $f$ tek ise: $\\int_{-a}^a f(x)\\,dx = 0$\n$f$ çift ise: $\\int_{-a}^a f(x)\\,dx = 2\\int_0^a f(x)\\,dx$" },
    { id: "mt65", ders: "AYT MATEMATİK", konu: "İntegral", baslik: "İntegral ile Alan Hesabı ve Riemann Toplamı", formul: "$x$ ekseni ile sınırlı alan: $A = \\int_a^b \\vert{}f(x)\\vert{}\\,dx$\nEksen üstündeki bölgeler pozitif, altındakiler mutlak değerce alınır.\nİki eğri arasında kalan alan: $A = \\int_a^b [f(x) - g(x)]\\,dx$ ($f(x) \\ge g(x)$ için)\n$y$ ekseni ile sınırlı alan: $A = \\int_c^d \\vert{}f^{-1}(y)\\vert{}\\,dy$\nRiemann: $[a, b]$ aralığı $n$ eşit parçaya bölününce $\\Delta x = \\frac{b - a}{n}$" },
  ];

  // Konu başlıkları (ders → konu). Hazır formüllerde konu yoksa buradan, kişisel formüllerde kullanıcının seçtiğinden gelir.
  var KONU = {
    fz1: 'Vektörler', fz2: 'Hareket', fz3: 'Kuvvet, Tork ve Denge', fz4: 'Basit Makineler',
    fz5: "Newton'ın Hareket Yasaları", fz6: 'Hareket', fz7: 'Atışlar',
    fz8: 'İş, Güç ve Enerji', fz9: 'İtme ve Momentum',
    fz10: 'Elektrik Alan ve Potansiyel', fz11: 'Elektrik Alan ve Potansiyel', fz12: 'Paralel Levhalar ve Sığa',
    fz13: 'Manyetik Alan ve Manyetik Kuvvet', fz14: 'Manyetik Alan ve Manyetik Kuvvet',
    fz15: 'İndüksiyon, Alternatif Akım ve Transformatörler', fz16: 'İndüksiyon, Alternatif Akım ve Transformatörler',
    fz17: 'Çembersel Hareket', fz18: 'Dönme, Yuvarlanma ve Açısal Momentum',
    fz19: 'Kütle Çekim ve Kepler Yasaları', fz20: 'Basit Harmonik Hareket',
    fz21: 'Dalga Mekaniği ve Elektromanyetik Dalgalar', fz22: 'Dalga Mekaniği ve Elektromanyetik Dalgalar', fz23: 'Dalga Mekaniği ve Elektromanyetik Dalgalar', fz24: 'Dalga Mekaniği ve Elektromanyetik Dalgalar', fz25: 'Dalga Mekaniği ve Elektromanyetik Dalgalar',
    fz26: 'Atom Modelleri', fz27: 'Radyoaktivite ve Kara Cisim Işıması',
    fz28: 'Fotoelektrik Olay ve Compton Olayı', fz29: 'Fotoelektrik Olay ve Compton Olayı'
  };


  var FAV = 'nk_fav_formul';

  function el(tag, css, text) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function toast(m, err) { try { showToast(m, !!err); } catch (e) {} }
  function norm(s) {
    return String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
  }
  function pretty(c) {
    return String(c).toLocaleLowerCase('tr-TR').split(' ').map(function (w) {
      return /^(tyt|ayt)$/.test(w) ? w.toUpperCase() : w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1);
    }).join(' ');
  }
  /* ---------- KaTeX (uygulamayla birlikte, internetsiz çalışır) ---------- */
  var kx = { st: 0 };   // 0 yüklenmedi, 1 yükleniyor, 2 hazır, 3 hata
  function loadKatex() {
    if (window.katex) { kx.st = 2; return; }
    if (kx.st) return;
    kx.st = 1;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'katex/katex.min.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = 'katex/katex.min.js';
    sc.onload = function () { kx.st = 2; try { if (host() && host().offsetParent !== null) list(); } catch (e) {} };
    sc.onerror = function () { kx.st = 3; };
    document.head.appendChild(sc);
  }
  function plainTex(t) { return t.replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\(cdot|times)/g, '·').replace(/\\([a-zA-Z]+)/g, '$1').replace(/[{}]/g, ''); }
  // "Etiket: $formül$ (not)" biçimindeki satırı çizer; $...$ arası matematik olarak gösterilir.
  // $ olmayan ama matematik gibi görünen satırlar (ör. F = m \\cdot a) otomatik matematik sayılır.
  function mathHtml(tex) {
    var m = el('span', 'font-size:1.1em');
    if (kx.st === 2 && window.katex) {
      try { m.innerHTML = window.katex.renderToString(tex, { throwOnError: false, displayMode: false }); }
      catch (e) { m.textContent = plainTex(tex); }
    } else m.textContent = plainTex(tex);
    return m;
  }
  // Uzun formüller satır kırmasın: tek satırda kalır, sığmıyorsa yazı küçülür (en fazla 11px'e kadar), yine sığmazsa kaydırılır.
  (function () {
    var st = document.createElement('style');
    st.textContent = '.nk-fm-row .katex{white-space:nowrap}';
    document.head.appendChild(st);
  })();
  function fitRow(row) {
    if (!row.clientWidth) return;
    var fs = 16;
    row.style.fontSize = fs + 'px';
    while (fs > 11 && row.scrollWidth > row.clientWidth + 1) { fs -= 1; row.style.fontSize = fs + 'px'; }
  }
  var fitQ = [];
  function watchFit(root) {
    root.querySelectorAll('.nk-fm-row').forEach(function (r) { fitQ.push(r); });
  }
  function flushFit() {
    var q = fitQ; fitQ = [];
    requestAnimationFrame(function () { q.forEach(function (r) { if (r.isConnected) fitRow(r); }); });
  }
  function renderLine(line) {
    var d = el('div', 'margin-top:8px;color:var(--ta,#0f766e);font-weight:600;max-width:100%');
    var text = String(line).trim();
    if (text.indexOf('$') < 0 && /[\\^_=]/.test(text)) {
      var lm = text.match(/^([^=\\^_{}]{1,80}?):\s+(.*)$/);
      text = lm ? lm[1] + ': $' + lm[2] + '$' : '$' + text + '$';
    }
    var parts = text.split('$');
    if (parts.length < 3) { d.style.cssText += ';font-size:15px;line-height:1.6;white-space:pre-wrap;word-break:break-word'; d.textContent = text; return d; }
    var label = '';
    if (parts[0].trim()) { label = parts[0].trim().replace(/:$/, ''); }
    if (label) d.appendChild(el('div', 'font-size:11px;font-weight:700;color:#64748b;margin-bottom:1px', label));
    var row = el('div', 'font-size:16px;line-height:1.5;overflow-x:auto;overflow-y:hidden');
    row.className = 'nk-fm-row';
    for (var i = 1; i < parts.length; i++) {
      if (i % 2 === 1) { if (parts[i]) row.appendChild(mathHtml(parts[i])); }
      else if (parts[i].trim()) row.appendChild(el('span', 'color:var(--nk-mute,#475569);font-weight:600;font-size:13px', parts[i]));
    }
    d.appendChild(row);
    return d;
  }
  function favs() { try { return JSON.parse(localStorage.getItem(FAV) || '{}') || {}; } catch (e) { return {}; } }
  function setFav(id, on) { var f = favs(); if (on) f[id] = 1; else delete f[id]; try { localStorage.setItem(FAV, JSON.stringify(f)); } catch (e) {} }

  function userList() {
    if (!Array.isArray(appState.formuller)) appState.formuller = [];
    return appState.formuller;
  }
  function courses() {
    var c = Object.keys((appState && appState.categories) || {});
    BUILTIN.forEach(function (f) { if (c.indexOf(f.ders) < 0) c.push(f.ders); });
    userList().forEach(function (f) { if (!f.deleted && c.indexOf(f.ders) < 0) c.push(f.ders); });
    return c;
  }
  function all() {
    var mine = userList().filter(function (f) { return !f.deleted; }).map(function (f) { return Object.assign({ mine: true }, f); });
    return BUILTIN.map(function (f) { return Object.assign({ mine: false, konu: KONU[f.id] || '' }, f); }).concat(mine);
  }

  /* ---------- Sekme (denemeler gibi) ---------- */
  var state = { q: '', course: '', konu: '' };
  function host() { return document.getElementById('formul-root'); }

  function open() {
    loadKatex();
    state.q = ''; state.course = ''; state.konu = '';
    try { switchTab('formul'); } catch (e) {}
  }
  function render() { loadKatex(); paint(); }
  // KaTeX'i uygulama boştayken önceden yükle; sekme ilk açılışta beklemesin
  try { if ('requestIdleCallback' in window) requestIdleCallback(loadKatex, { timeout: 4000 }); else setTimeout(loadKatex, 2500); } catch (e) {}

  function paint() {
    var root = host();
    if (!root) return;
    var oldList = root.querySelector('#nk-fm-list');
    root.innerHTML = '';

    // Diğer sekmelerle aynı başlık: ikon + Sora yazı tipi
    var head = document.createElement('div');
    head.className = 'flex justify-between items-center border-b border-slate-200 pb-2';
    head.style.marginBottom = '12px';
    var h2 = document.createElement('h2');
    h2.className = 'text-xl font-semibold text-slate-800 flex items-center gap-2 font-display tracking-tight';
    h2.innerHTML = '<svg class="w-6 h-6 fill-current text-teal-600" viewBox="0 0 24 24"><path d="M18 4H6v2l6.5 6L6 18v2h12v-3h-7l5-5-5-5h7z"/></svg>Formüller';
    head.appendChild(h2);
    var add = el('button', 'padding:8px 14px;border-radius:12px;border:0;background:linear-gradient(135deg,var(--t1,#0d9488),var(--t2,#0d9488));color:#fff;font-weight:800;font-size:12px;box-shadow:0 3px 0 #0f766e', '+ Ekle');
    add.onclick = function () { openAdd(null); };
    head.appendChild(add);
    root.appendChild(head);

    var inp = el('input', 'width:100%;border:1px solid var(--nk-line2,#cbd5e1);border-radius:12px;padding:10px 12px;font-size:13px;color:var(--nk-ink,#0f172a);background:#fff;margin-bottom:10px');
    inp.type = 'search';
    inp.placeholder = 'Formül ara (ör. tork, momentum)';
    inp.value = state.q;
    inp.oninput = function () { state.q = inp.value; list(); };
    root.appendChild(inp);

    // Çipler alt alta sarılır (yatay kaydırma yok); sadece formülü olan dersler gösterilir
    var have = courses().filter(function (c) { return all().some(function (x) { return x.ders === c; }); });
    if (state.course && state.course !== '__fav' && have.indexOf(state.course) < 0) state.course = '';
    var chips = el('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px');
    function chip(label, val) {
      var on = state.course === val;
      var b = el('button', 'padding:6px 12px;border-radius:9999px;font-size:11px;font-weight:700;border:1px solid ' + (on ? 'var(--t1,#0d9488)' : 'var(--nk-line2,#cbd5e1)') + ';background:' + (on ? 'var(--t1,#0d9488)' : 'var(--nk-surf,#fff)') + ';color:' + (on ? '#fff' : '#475569'), label);
      b.onclick = function () { state.course = val; state.konu = ''; paint(); };
      chips.appendChild(b);
    }
    chip('★ Yıldızlılar', '__fav');
    have.forEach(function (c) { chip(pretty(c), c); });
    chips.id = 'nk-fm-chips';
    root.appendChild(chips);

    // Seçili dersin konu başlıkları (ikinci satır)
    if (state.course && state.course !== '__fav') {
      var ks = [];
      all().forEach(function (x) { if (x.ders === state.course && x.konu && ks.indexOf(x.konu) < 0) ks.push(x.konu); });
      if (state.konu && ks.indexOf(state.konu) < 0) state.konu = '';
      if (ks.length > 1) {
        var wrap = el('div', 'margin:-2px 0 12px');
        var btn = el('button', 'width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;border:1px solid var(--nk-line2,#cbd5e1);border-radius:12px;padding:10px 12px;font-size:13px;font-weight:700;color:var(--nk-ink,#0f172a);background:var(--nk-surf,#fff)');
        btn.appendChild(el('span', 'flex:1', state.konu || 'Tüm konular (' + ks.length + ')'));
        var chev = el('span', 'font-size:11px;color:var(--ta,#0d9488);transition:transform .2s', '▼');
        btn.appendChild(chev);
        var panel = el('div', 'display:none;margin-top:6px;max-height:46vh;overflow-y:auto;border:1px solid var(--nk-line2,#cbd5e1);border-radius:12px;background:var(--nk-surf,#fff);box-shadow:0 6px 18px rgba(15,23,42,.10)');
        var pick = function (label, val) {
          var on = state.konu === val;
          var r = el('button', 'display:flex;width:100%;align-items:center;justify-content:space-between;text-align:left;padding:11px 12px;font-size:13px;font-weight:' + (on ? '800' : '600') + ';border:0;border-bottom:1px solid var(--nk-line,#e2e8f0);background:' + (on ? 'var(--tsoft,rgba(13,148,136,.12))' : 'transparent') + ';color:' + (on ? 'var(--ta,#0f766e)' : 'var(--nk-ink,#0f172a)'));
          r.appendChild(el('span', '', label));
          if (on) r.appendChild(el('span', '', '✓'));
          r.onclick = function () { state.konu = val; paint(); };
          panel.appendChild(r);
        };
        pick('Tüm konular (' + ks.length + ')', '');
        ks.forEach(function (k) { pick(k, k); });
        btn.onclick = function () { var o = panel.style.display === 'none'; panel.style.display = o ? 'block' : 'none'; chev.style.transform = o ? 'rotate(180deg)' : ''; };
        wrap.appendChild(btn); wrap.appendChild(panel);
        root.appendChild(wrap);
      }
    }

    var lst = el('div', '');
    lst.id = 'nk-fm-list';
    root.appendChild(lst);
    list();
  }

  var listTok = 0;
  function list() {
    var lst = document.getElementById('nk-fm-list');
    if (!lst) return;
    lst.innerHTML = '';
    var f = favs(), q = norm(state.q).trim();
    var items = all().filter(function (x) {
      if (state.course === '__fav') { if (!f[x.id]) return false; }
      else if (state.course && x.ders !== state.course) return false;
      if (state.konu && x.konu !== state.konu) return false;
      if (q && norm(x.baslik + ' ' + x.formul + ' ' + x.ders).indexOf(q) < 0) return false;
      return true;
    });
    var order = courses();
    items.sort(function (a, b) {
      var fa = f[a.id] ? 0 : 1, fb = f[b.id] ? 0 : 1;
      if (!state.course && !q && fa !== fb) return fa - fb;
      return order.indexOf(a.ders) - order.indexOf(b.ders);
    });

    // Ders seçilmemiş ve arama yok: yıldızlılar + ders kutuları (ağır liste yerine hızlı özet)
    var overview = !state.course && !q;
    var isFav = state.course === '__fav';
    if (overview) {
      var tiles = el('div', 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:6px');
      courses().forEach(function (c) {
        var its = all().filter(function (x) { return x.ders === c; });
        if (!its.length) return;
        var ks = []; its.forEach(function (x) { if (x.konu && ks.indexOf(x.konu) < 0) ks.push(x.konu); });
        var tile = el('button', 'text-align:left;padding:14px;border-radius:18px;border:1px solid var(--nk-line,#e2e8f0);background:var(--nk-surf,#fff);box-shadow:0 1px 2px rgba(15,23,42,.04)');
        tile.appendChild(el('div', 'font-weight:800;font-size:13px;color:var(--nk-ink,#0f172a);line-height:1.25', pretty(c)));
        tile.appendChild(el('div', 'margin-top:6px;font-size:11px;font-weight:700;color:#64748b', its.length + ' formül' + (ks.length ? ' · ' + ks.length + ' konu' : '')));
        tile.onclick = function () { state.course = c; state.konu = ''; paint(); };
        tiles.appendChild(tile);
      });
      lst.appendChild(tiles);
      return;
    }

    if (!items.length) {
      var empty = el('div', 'text-align:center;color:#64748b;padding:48px 16px;font-size:13px;line-height:1.6');
      empty.innerHTML = isFav && !q ? 'Henüz yıldızladığın formül yok.<br>Bir formülün sağ üstündeki <b>★</b> işaretine basınca burada toplanır.' : all().length
        ? 'Bu aramayla eşleşen formül yok.'
        : '<b style="color:var(--nk-ink,#0f172a)">Henüz formül yok.</b><br>Sağ üstten <b>+ Ekle</b> ile kendi formülünü ekleyebilirsin. Gemini ile de ekleyebilirsin: Ekle sekmesindeki "Gemini ile ekle" düğmesine bas ve adımları izle.';
      lst.appendChild(empty);
      return;
    }

    var lastCourse = null;
    var token = ++listTok;
    function addCard(x) {
      var starred = !!f[x.id];
      var gkey = (state.course && !isFav ? '' : x.ders + ' · ') + (x.konu || '');
      if (!overview && gkey && gkey !== lastCourse) {
        lastCourse = gkey;
        lst.appendChild(el('div', 'margin:14px 2px 6px;font-size:11px;font-weight:800;letter-spacing:.06em;color:#64748b;text-transform:uppercase', state.course && !isFav ? gkey : pretty(x.ders) + (x.konu ? ' · ' + x.konu : '')));
      }
      var card = el('div', 'background:var(--nk-surf,#fff);border:1px solid var(--nk-line,#e2e8f0);border-radius:18px;padding:14px;margin-bottom:10px;box-shadow:0 1px 2px rgba(15,23,42,.04)');
      var top = el('div', 'display:flex;align-items:flex-start;gap:8px');
      var t = el('div', 'flex:1;font-weight:800;font-size:14px;color:var(--nk-ink,#0f172a);line-height:1.3', x.baslik);
      top.appendChild(t);
      var star = el('button', 'border:0;background:transparent;font-size:20px;line-height:1;color:' + (starred ? '#f59e0b' : '#cbd5e1'), '★');
      star.setAttribute('aria-label', 'Yıldızla');
      star.onclick = function () { setFav(x.id, !starred); list(); };
      top.appendChild(star);
      card.appendChild(top);
      if (starred) card.appendChild(el('div', 'font-size:10px;font-weight:800;color:#64748b;margin-top:2px', pretty(x.ders)));
      var body = el('div', 'margin-top:4px');
      String(x.formul).split('\n').forEach(function (ln) { if (ln.trim()) body.appendChild(renderLine(ln)); });
      card.appendChild(body);
      if (x.kaynak) card.appendChild(el('div', 'margin-top:8px;font-size:10px;font-weight:600;color:#94a3b8', 'Kaynak: ' + x.kaynak));
      if (x.mine) {
        var row = el('div', 'display:flex;gap:14px;margin-top:10px');
        var ed = el('button', 'border:0;background:transparent;font-size:11px;font-weight:700;color:var(--ta,#0d9488);padding:0', 'Düzenle');
        ed.onclick = function () { openAdd(x); };
        var del = el('button', 'border:0;background:transparent;font-size:11px;font-weight:700;color:#e11d48;padding:0', 'Sil');
        del.onclick = function () { remove(x.id); };
        row.appendChild(ed); row.appendChild(del);
        card.appendChild(row);
      }
      lst.appendChild(card);
      watchFit(card);
    }
    // İlk kartlar hemen, kalanlar parça parça: sekme açılırken takılma olmasın
    var idx = 0;
    (function step() {
      if (token !== listTok) return;
      var n = 0;
      while (idx < items.length && n < 4) { addCard(items[idx++]); n++; }
      flushFit();
      if (idx < items.length) requestAnimationFrame(step);
    })();
  }

  /* ---------- Kaydetme ---------- */
  async function persist() { try { await saveSettings(); } catch (e) { console.warn(e); } }

  async function remove(id) {
    var l = userList();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) { l[i] = { id: id, deleted: true }; }
    await persist();
    toast('Formül silindi');
    list();
  }

  /* ---------- Ekleme / düzenleme formu ---------- */
  function openAdd(item, pre) {
    var d = item || pre || {};
    var ov = el('div', 'position:fixed;inset:0;z-index:2147483200;background:var(--nk-surf,#fff);overflow-y:auto;font-family:inherit');
    var box = el('div', 'max-width:480px;margin:0 auto;padding:18px 18px 40px');
    var hd = el('div', 'display:flex;align-items:center;gap:10px;margin-bottom:8px');
    var bk = el('button', 'width:38px;height:38px;border-radius:12px;border:0;background:var(--nk-soft,#f1f5f9);color:var(--nk-ink,#334155);font-size:18px;font-weight:700', '←');
    bk.onclick = function () { ov.remove(); };
    hd.appendChild(bk);
    hd.appendChild(el('div', 'font-weight:800;font-size:17px;color:var(--nk-ink,#0f172a)', item ? 'Formülü düzenle' : 'Yeni formül'));
    box.appendChild(hd);

    function lab(t) { box.appendChild(el('div', 'font-size:11px;font-weight:700;color:#64748b;margin:14px 0 6px', t)); }
    lab('Ders');
    var cs = Object.keys((appState && appState.categories) || {});
    if (d.ders && cs.indexOf(d.ders) < 0) cs.push(d.ders);
    if (!cs.length) cs = ['GENEL'];
    var chosen = d.ders || state.course || cs[0];
    var wrap = el('div', 'display:flex;flex-wrap:wrap;gap:6px');
    function drawChips() {
      wrap.innerHTML = '';
      cs.forEach(function (c) {
        var on = c === chosen;
        var b = el('button', 'padding:7px 12px;border-radius:9999px;font-size:11px;font-weight:700;border:1px solid ' + (on ? 'var(--t1,#0d9488)' : 'var(--nk-line2,#cbd5e1)') + ';background:' + (on ? 'var(--t1,#0d9488)' : 'var(--nk-surf,#fff)') + ';color:' + (on ? '#fff' : '#475569'), pretty(c));
        b.onclick = function () { chosen = c; drawChips(); };
        wrap.appendChild(b);
      });
    }
    drawChips();
    box.appendChild(wrap);
    lab('Başlık');
    var tin = el('input', 'width:100%;border:1px solid var(--nk-line2,#cbd5e1);border-radius:12px;padding:11px;font-size:14px;color:var(--nk-ink,#0f172a);background:#fff');
    tin.value = d.baslik || ''; tin.placeholder = 'ör. Tork'; tin.maxLength = 80;
    box.appendChild(tin);
    lab('Formül');
    var fin = el('textarea', 'width:100%;height:140px;border:1px solid var(--nk-line2,#cbd5e1);border-radius:12px;padding:11px;font-size:15px;color:var(--nk-ink,#0f172a);background:#fff');
    fin.value = d.formul || ''; fin.placeholder = 'Her formülü ayrı satıra yaz. Örn: F = m \\cdot a'; fin.maxLength = 1500;
    var snips = [['a/b', '\\frac{a}{b}'], ['xⁿ', '^{n}'], ['xₙ', '_{n}'], ['√', '\\sqrt{x}'], ['·', ' \\cdot '], ['±', ' \\pm '], ['π', '\\pi '], ['Δ', '\\Delta '], ['ω', '\\omega '], ['θ', '\\theta '], ['λ', '\\lambda '], ['τ', '\\tau '], ['α', '\\alpha '], ['Σ', '\\sum ']];
    var bar = el('div', 'display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px');
    snips.forEach(function (sn) {
      var b = el('button', 'padding:6px 10px;border-radius:9px;border:1px solid var(--nk-line2,#cbd5e1);background:var(--nk-soft,#f8fafc);color:#334155;font-size:13px;font-weight:700', sn[0]);
      b.type = 'button';
      b.onmousedown = function (e) { e.preventDefault(); };
      b.onclick = function () {
        var st = fin.selectionStart == null ? fin.value.length : fin.selectionStart, en = fin.selectionEnd == null ? st : fin.selectionEnd;
        fin.value = fin.value.slice(0, st) + sn[1] + fin.value.slice(en);
        var pos = st + sn[1].length; fin.focus(); try { fin.setSelectionRange(pos, pos); } catch (e) {}
        prev();
      };
      bar.appendChild(b);
    });
    box.appendChild(bar);
    box.appendChild(fin);
    var pv = el('div', 'margin-top:10px;padding:10px 12px;border:1px dashed #cbd5e1;border-radius:12px;background:var(--nk-soft,#f8fafc);min-height:40px');
    function prev() {
      pv.innerHTML = '';
      var any = false;
      fin.value.split('\n').forEach(function (ln) { if (ln.trim()) { any = true; pv.appendChild(renderLine(ln)); } });
      if (!any) pv.appendChild(el('div', 'font-size:12px;color:#94a3b8', 'Önizleme burada görünür'));
    }
    fin.oninput = prev;
    box.appendChild(el('div', 'font-size:11px;font-weight:700;color:#64748b;margin:12px 0 4px', 'Önizleme'));
    box.appendChild(pv);
    loadKatex();
    prev();
    if (kx.st === 1) { var t = setInterval(function () { if (kx.st !== 1 || !document.body.contains(pv)) { clearInterval(t); prev(); } }, 200); }

    var row = el('div', 'display:flex;gap:8px;margin-top:18px');
    var cancel = el('button', 'flex:1;padding:13px;border-radius:12px;border:0;background:var(--nk-soft,#f1f5f9);color:var(--nk-mute,#475569);font-weight:700;font-size:13px', 'Vazgeç');
    cancel.onclick = function () { ov.remove(); };
    var ok = el('button', 'flex:1;padding:13px;border-radius:12px;border:0;background:linear-gradient(135deg,var(--t1,#0d9488),var(--t2,#0d9488));color:#fff;font-weight:800;font-size:13px', 'Kaydet');
    ok.onclick = async function () {
      var b = tin.value.trim(), f = fin.value.trim();
      if (!b || !f) { toast('Başlık ve formülü yaz!', true); return; }
      var l = userList();
      if (item) {
        l.forEach(function (x) { if (x.id === item.id) { x.ders = chosen; x.baslik = b; x.formul = f; } });
      } else {
        l.push({ id: 'u' + Date.now(), ders: chosen, baslik: b, formul: f });
      }
      ov.remove();
      await persist();
      toast('Formül kaydedildi');
      if (host() && host().offsetParent !== null) paint(); else open();
    };
    row.appendChild(cancel); row.appendChild(ok);
    box.appendChild(row);
    ov.appendChild(box);
    document.body.appendChild(ov);
  }

  function start() { /* giriş düğmesi üst çubukta (index.html) */ }

  window.__nkFormul = {
    open: open,
    openAdd: openAdd,
    render: render,
    // Gemini'den gelen kayıt: ders listede varsa seçilir
    addFromParsed: function (p) {
      var cs = Object.keys((appState && appState.categories) || {});
      var w = norm(p.ders), found = '';
      cs.forEach(function (c) { var n = norm(c); if (!found && w && (n === w || n.indexOf(w) >= 0 || w.indexOf(n) >= 0)) found = c; });
      openAdd(null, { ders: found, baslik: p.baslik || p.on || '', formul: p.formul || p.not || '' });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
