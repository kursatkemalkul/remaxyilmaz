// Yönetim paneli — ilanlar GitHub deposuna yazılır, site 1-2 dk içinde güncellenir
(function(){
  var API = "https://api.github.com/repos/" + AYAR.githubSahip + "/" + AYAR.githubRepo + "/contents/";
  var ANAHTAR_SAKLA = "remax_erisim_anahtari";
  var ilanlar = [];
  var jsonSha = null;
  var duzenlenenId = null;      // null = yeni ilan
  var mevcutFotolar = [];       // düzenlemede repodaki mevcut fotoğraf yolları
  var yeniFotolar = [];         // {base64, onizlemeUrl}
  var mesgulMu = false;

  // ---------- Yardımcılar ----------
  function $(id){ return document.getElementById(id); }
  function anahtar(){ return localStorage.getItem(ANAHTAR_SAKLA) || ""; }

  function mesaj(yazi, tur, kalici){
    var m = $("durumMesaj");
    m.textContent = yazi;
    m.className = "durum-mesaj" + (tur ? " " + tur : "");
    clearTimeout(m._zaman);
    if(!kalici) m._zaman = setTimeout(function(){ m.classList.add("gizli"); }, 4000);
  }

  function ekran(ad){
    ["girisEkrani","listeEkrani","formEkrani"].forEach(function(e){
      $(e).classList.toggle("gizli", e !== ad);
    });
    window.scrollTo(0,0);
  }

  function utf8ToBase64(str){
    return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(str)));
  }
  function base64ToUtf8(b64){
    var temiz = b64.replace(/\n/g,"");
    var bytes = Uint8Array.from(atob(temiz), function(c){ return c.charCodeAt(0); });
    return new TextDecoder().decode(bytes);
  }

  function ghIstek(yol, secenek){
    secenek = secenek || {};
    secenek.headers = Object.assign({
      "Authorization": "token " + anahtar(),
      "Accept": "application/vnd.github+json"
    }, secenek.headers || {});
    return fetch(API + yol, secenek);
  }

  function ghYaz(yol, base64Icerik, aciklama, sha){
    var govde = { message: aciklama, content: base64Icerik };
    if(sha) govde.sha = sha;
    return ghIstek(yol, { method: "PUT", body: JSON.stringify(govde) })
      .then(function(r){
        if(!r.ok) throw new Error("Yazma hatası: " + r.status);
        return r.json();
      });
  }

  function ghSil(yol, sha, aciklama){
    return ghIstek(yol, { method: "DELETE", body: JSON.stringify({ message: aciklama, sha: sha }) });
  }

  // ---------- Veri ----------
  function ilanlariYukle(){
    return ghIstek("veri/ilanlar.json?ref=main&t=" + Date.now())
      .then(function(r){
        if(r.status === 404){ ilanlar = []; jsonSha = null; return; }
        if(!r.ok) throw new Error("okuma " + r.status);
        return r.json().then(function(d){
          jsonSha = d.sha;
          try { ilanlar = JSON.parse(base64ToUtf8(d.content)); }
          catch(e){ ilanlar = []; }
          if(!Array.isArray(ilanlar)) ilanlar = [];
        });
      });
  }

  function ilanlariKaydet(aciklama){
    var icerik = utf8ToBase64(JSON.stringify(ilanlar, null, 2));
    return ghYaz("veri/ilanlar.json", icerik, aciklama, jsonSha)
      .then(function(sonuc){ jsonSha = sonuc.content.sha; });
  }

  // ---------- Giriş ----------
  function girisDene(){
    var girilen = $("anahtarGirdi").value.trim();
    if(!girilen){ mesaj("Anahtarı yapıştırın.", "hata"); return; }
    mesaj("Kontrol ediliyor…");
    fetch("https://api.github.com/repos/" + AYAR.githubSahip + "/" + AYAR.githubRepo, {
      headers: { "Authorization": "token " + girilen }
    }).then(function(r){
      if(r.ok){
        localStorage.setItem(ANAHTAR_SAKLA, girilen);
        mesaj("Hoş geldiniz!", "basari");
        basla();
      } else {
        mesaj("Anahtar geçersiz. Kontrol edip tekrar deneyin.", "hata");
      }
    }).catch(function(){ mesaj("Bağlantı hatası. İnternetinizi kontrol edin.", "hata"); });
  }

  // ---------- Liste ----------
  function listeCiz(){
    var kutu = $("ilanListesi");
    var sirali = ilanlar.slice().sort(function(a,b){ return (b.tarih||0) - (a.tarih||0); });
    kutu.innerHTML = sirali.map(function(i){
      var kapak = (i.fotograflar && i.fotograflar[0]) ? i.fotograflar[0] : "";
      var durum = i.durum === "satildi" ? (i.tip === "kiralik" ? "KİRALANDI" : "SATILDI") : (i.tip === "kiralik" ? "Kiralık" : "Satılık");
      return '<div class="yonetim-ilan">' +
        (kapak ? '<img src="' + kapak + '" alt="">' : '<img alt="">') +
        '<div class="orta">' +
          '<div class="baslik">' + (i.baslik || "(başlıksız)") + '</div>' +
          '<div class="alt">' + (Number(i.fiyat)||0).toLocaleString("tr-TR") + " TL · " + durum + '</div>' +
        '</div>' +
        '<div class="btnler">' +
          '<button class="kucuk-btn" data-duzenle="' + i.id + '">Düzenle</button>' +
          '<button class="kucuk-btn tehlike" data-sil="' + i.id + '">Sil</button>' +
        '</div>' +
      '</div>';
    }).join("");
    $("listeBos").classList.toggle("gizli", ilanlar.length > 0);
  }

  // ---------- Form ----------
  function formTemizle(){
    duzenlenenId = null;
    mevcutFotolar = [];
    yeniFotolar = [];
    $("formBaslik").textContent = "Yeni İlan";
    tipAyarla("satilik");
    ["fBaslik","fFiyat","fMahalle","fM2brut","fM2net","fOda","fBinaYasi","fKat",
     "fKatSayisi","fIsitma","fBanyo","fAidat","fTapu","fAciklama"].forEach(function(id){ $(id).value = ""; });
    $("fIlce").value = "";
    $("fKategori").value = "Daire";
    $("fBalkon").value = ""; $("fEsyali").value = ""; $("fKredi").value = "";
    $("fSatildi").checked = false;
    fotoOnizle();
  }

  function formDoldur(ilan){
    duzenlenenId = ilan.id;
    mevcutFotolar = (ilan.fotograflar || []).slice();
    yeniFotolar = [];
    $("formBaslik").textContent = "İlanı Düzenle";
    tipAyarla(ilan.tip || "satilik");
    $("fBaslik").value = ilan.baslik || "";
    $("fFiyat").value = ilan.fiyat || "";
    $("fKategori").value = ilan.kategori || "Daire";
    $("fIlce").value = ilan.ilce || "";
    $("fMahalle").value = ilan.mahalle || "";
    $("fM2brut").value = ilan.m2brut || "";
    $("fM2net").value = ilan.m2net || "";
    $("fOda").value = ilan.odaSayisi || "";
    $("fBinaYasi").value = ilan.binaYasi || "";
    $("fKat").value = ilan.bulunduguKat || "";
    $("fKatSayisi").value = ilan.katSayisi || "";
    $("fIsitma").value = ilan.isitma || "";
    $("fBanyo").value = ilan.banyoSayisi || "";
    $("fBalkon").value = ilan.balkon || "";
    $("fEsyali").value = ilan.esyali || "";
    $("fAidat").value = ilan.aidat || "";
    $("fKredi").value = ilan.krediyeUygun || "";
    $("fTapu").value = ilan.tapuDurumu || "";
    $("fAciklama").value = ilan.aciklama || "";
    $("fSatildi").checked = ilan.durum === "satildi";
    fotoOnizle();
  }

  function seciliTip(){
    return $("tipSecim").querySelector(".secili").dataset.deger;
  }
  function tipAyarla(tip){
    $("tipSecim").querySelectorAll(".filtre").forEach(function(b){
      b.classList.toggle("secili", b.dataset.deger === tip);
    });
    $("satildiEtiket").textContent = tip === "kiralik" ? "Kiralandı olarak işaretle" : "Satıldı olarak işaretle";
  }

  // ---------- Fotoğraflar ----------
  function fotoOnizle(){
    var kutu = $("fotoOnizleme");
    var parcalar = [];
    mevcutFotolar.forEach(function(yol, i){
      parcalar.push('<div class="kutu"><img src="' + yol + '">' +
        '<button type="button" class="sil" data-mevcut="' + i + '">✕</button>' +
        (i === 0 && parcalar.length === 0 ? '<span class="kapak">KAPAK</span>' : "") + '</div>');
    });
    yeniFotolar.forEach(function(f, i){
      parcalar.push('<div class="kutu"><img src="' + f.onizlemeUrl + '">' +
        '<button type="button" class="sil" data-yeni="' + i + '">✕</button>' +
        (mevcutFotolar.length === 0 && i === 0 ? '<span class="kapak">KAPAK</span>' : "") + '</div>');
    });
    kutu.innerHTML = parcalar.join("");
  }

  function fotoIsle(dosya){
    return new Promise(function(coz, reddet){
      var okuyucu = new FileReader();
      okuyucu.onload = function(){
        var img = new Image();
        img.onload = function(){
          var enUzun = 1600;
          var oran = Math.min(1, enUzun / Math.max(img.width, img.height));
          var tuval = document.createElement("canvas");
          tuval.width = Math.round(img.width * oran);
          tuval.height = Math.round(img.height * oran);
          tuval.getContext("2d").drawImage(img, 0, 0, tuval.width, tuval.height);
          var dataUrl = tuval.toDataURL("image/jpeg", 0.82);
          coz({ base64: dataUrl.split(",")[1], onizlemeUrl: dataUrl });
        };
        img.onerror = reddet;
        img.src = okuyucu.result;
      };
      okuyucu.onerror = reddet;
      okuyucu.readAsDataURL(dosya);
    });
  }

  // ---------- Yayınlama ----------
  function yayinla(){
    if(mesgulMu) return;
    var baslik = $("fBaslik").value.trim();
    var fiyat = parseInt($("fFiyat").value.replace(/[^\d]/g,""), 10);
    if(!baslik){ mesaj("İlan başlığı yazın.", "hata"); return; }
    if(!fiyat){ mesaj("Fiyat yazın.", "hata"); return; }
    if(mevcutFotolar.length + yeniFotolar.length === 0){ mesaj("En az bir fotoğraf ekleyin.", "hata"); return; }

    mesgulMu = true;
    $("yayinlaBtn").textContent = "YAYINLANIYOR…";

    var id = duzenlenenId || (Date.now().toString(36) + Math.random().toString(36).slice(2,6));
    var fotoYollari = mevcutFotolar.slice();
    var sira = Promise.resolve();

    // Yeni fotoğrafları sırayla yükle
    yeniFotolar.forEach(function(f, i){
      sira = sira.then(function(){
        mesaj("Fotoğraf yükleniyor " + (i+1) + " / " + yeniFotolar.length + "…", "", true);
        var yol = "fotograflar/" + id + "/" + Date.now().toString(36) + "-" + i + ".jpg";
        return ghYaz(yol, f.base64, "Fotoğraf: " + baslik).then(function(){
          fotoYollari.push(yol);
        });
      });
    });

    sira.then(function(){
      mesaj("İlan kaydediliyor…", "", true);
      var ilan = {
        id: id,
        baslik: baslik,
        fiyat: fiyat,
        tip: seciliTip(),
        durum: $("fSatildi").checked ? "satildi" : "aktif",
        kategori: $("fKategori").value,
        il: "İstanbul",
        ilce: $("fIlce").value.trim(),
        mahalle: $("fMahalle").value.trim(),
        m2brut: $("fM2brut").value.trim(),
        m2net: $("fM2net").value.trim(),
        odaSayisi: $("fOda").value.trim(),
        binaYasi: $("fBinaYasi").value.trim(),
        bulunduguKat: $("fKat").value.trim(),
        katSayisi: $("fKatSayisi").value.trim(),
        isitma: $("fIsitma").value.trim(),
        banyoSayisi: $("fBanyo").value.trim(),
        balkon: $("fBalkon").value,
        esyali: $("fEsyali").value,
        aidat: $("fAidat").value.replace(/[^\d]/g,""),
        krediyeUygun: $("fKredi").value,
        tapuDurumu: $("fTapu").value.trim(),
        aciklama: $("fAciklama").value.trim(),
        fotograflar: fotoYollari,
        tarih: duzenlenenId ? (ilanlar.find(function(x){return x.id===id;}) || {}).tarih || Date.now() : Date.now()
      };
      var mevcut = ilanlar.findIndex(function(x){ return x.id === id; });
      if(mevcut >= 0) ilanlar[mevcut] = ilan; else ilanlar.push(ilan);
      return ilanlariKaydet((duzenlenenId ? "İlan güncellendi: " : "Yeni ilan: ") + baslik);
    }).then(function(){
      mesgulMu = false;
      $("yayinlaBtn").textContent = "YAYINLA";
      mesaj("✓ Yayınlandı! Sitede 1-2 dakika içinde görünür.", "basari");
      listeCiz();
      ekran("listeEkrani");
    }).catch(function(hata){
      mesgulMu = false;
      $("yayinlaBtn").textContent = "YAYINLA";
      console.error(hata);
      mesaj("Hata oluştu. İnternetinizi kontrol edip tekrar deneyin.", "hata");
    });
  }

  // ---------- Silme ----------
  function ilanSil(id){
    var ilan = ilanlar.find(function(x){ return x.id === id; });
    if(!ilan) return;
    if(!confirm('"' + ilan.baslik + '" ilanı silinsin mi?\nBu işlem geri alınamaz.')) return;
    mesaj("Siliniyor…", "", true);

    ilanlar = ilanlar.filter(function(x){ return x.id !== id; });
    ilanlariKaydet("İlan silindi: " + ilan.baslik).then(function(){
      // Fotoğrafları arka planda temizle (başarısız olsa da ilan silinmiş olur)
      return ghIstek("fotograflar/" + id + "?ref=main").then(function(r){
        if(!r.ok) return;
        return r.json().then(function(dosyalar){
          var s = Promise.resolve();
          (Array.isArray(dosyalar) ? dosyalar : []).forEach(function(d){
            s = s.then(function(){ return ghSil(d.path, d.sha, "Fotoğraf silindi"); });
          });
          return s;
        });
      }).catch(function(){});
    }).then(function(){
      mesaj("✓ İlan silindi. Sitede 1-2 dakika içinde kaybolur.", "basari");
      listeCiz();
    }).catch(function(){
      mesaj("Silme sırasında hata oluştu. Tekrar deneyin.", "hata");
      ilanlariYukle().then(listeCiz);
    });
  }

  // ---------- Olaylar ----------
  $("girisBtn").addEventListener("click", girisDene);
  $("anahtarGirdi").addEventListener("keydown", function(e){ if(e.key === "Enter") girisDene(); });

  $("cikisBtn").addEventListener("click", function(){
    if(confirm("Çıkış yapılsın mı? Tekrar girmek için anahtar gerekir.")){
      localStorage.removeItem(ANAHTAR_SAKLA);
      ekran("girisEkrani");
    }
  });

  $("yeniIlanBtn").addEventListener("click", function(){ formTemizle(); ekran("formEkrani"); });
  $("formGeriBtn").addEventListener("click", function(){ ekran("listeEkrani"); });

  $("tipSecim").addEventListener("click", function(e){
    var b = e.target.closest(".filtre");
    if(b) tipAyarla(b.dataset.deger);
  });

  $("fotoEkleBtn").addEventListener("click", function(){ $("fFotolar").click(); });
  $("fFotolar").addEventListener("change", function(){
    var dosyalar = Array.from(this.files || []);
    this.value = "";
    if(!dosyalar.length) return;
    mesaj("Fotoğraflar hazırlanıyor…", "", true);
    var s = Promise.resolve();
    dosyalar.forEach(function(d){
      s = s.then(function(){ return fotoIsle(d).then(function(f){ yeniFotolar.push(f); fotoOnizle(); }); });
    });
    s.then(function(){ mesaj("✓ " + dosyalar.length + " fotoğraf eklendi", "basari"); })
     .catch(function(){ mesaj("Bir fotoğraf işlenemedi.", "hata"); });
  });

  $("fotoOnizleme").addEventListener("click", function(e){
    var b = e.target.closest(".sil");
    if(!b) return;
    if(b.dataset.mevcut != null) mevcutFotolar.splice(Number(b.dataset.mevcut), 1);
    if(b.dataset.yeni != null) yeniFotolar.splice(Number(b.dataset.yeni), 1);
    fotoOnizle();
  });

  $("ilanListesi").addEventListener("click", function(e){
    var d = e.target.closest("[data-duzenle]");
    var s = e.target.closest("[data-sil]");
    if(d){
      var ilan = ilanlar.find(function(x){ return x.id === d.dataset.duzenle; });
      if(ilan){ formDoldur(ilan); ekran("formEkrani"); }
    }
    if(s) ilanSil(s.dataset.sil);
  });

  $("yayinlaBtn").addEventListener("click", yayinla);

  // ---------- Başlat ----------
  function basla(){
    ekran("listeEkrani");
    mesaj("İlanlar yükleniyor…", "", true);
    ilanlariYukle().then(function(){
      $("durumMesaj").classList.add("gizli");
      listeCiz();
    }).catch(function(){
      mesaj("İlanlar yüklenemedi. Sayfayı yenileyin.", "hata");
    });
  }

  if(anahtar()){ basla(); } else { ekran("girisEkrani"); }
})();
