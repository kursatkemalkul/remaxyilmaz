// İlan detay sayfası
(function(){
  document.getElementById("yil").textContent = new Date().getFullYear();
  document.getElementById("ustAraBtn").href = "tel:" + AYAR.telefon;

  var id = new URLSearchParams(location.search).get("id");
  var kutu = document.getElementById("detay");

  function kacis(s){
    return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function goster(ilan){
    var fotolar = (ilan.fotograflar && ilan.fotograflar.length) ? ilan.fotograflar : [];
    var satildi = ilan.durum === "satildi";
    var kiralik = ilan.tip === "kiralik";
    var konum = [ilan.mahalle, ilan.ilce, ilan.il].filter(Boolean).join(", ");
    var fiyat = (Number(ilan.fiyat)||0).toLocaleString("tr-TR") + " TL" + (kiralik ? ' <span class="donem">/ ay</span>' : "");

    document.title = kacis(ilan.baslik) + " | Yılmaz Kanyılmaz — RE/MAX";

    function m2Yaz(deger){
      if(!deger) return "";
      return String(deger).replace(/\s*(m2|m²|metrekare)\s*/gi, "").trim() + " m²";
    }
    var ozellikler = [
      ["İlan Tipi", kiralik ? "Kiralık" : "Satılık"],
      ["Kategori", ilan.kategori],
      ["Brüt m²", m2Yaz(ilan.m2brut)],
      ["Net m²", m2Yaz(ilan.m2net)],
      ["Oda Sayısı", ilan.odaSayisi],
      ["Bina Yaşı", ilan.binaYasi],
      ["Bulunduğu Kat", ilan.bulunduguKat],
      ["Kat Sayısı", ilan.katSayisi],
      ["Isıtma", ilan.isitma],
      ["Banyo Sayısı", ilan.banyoSayisi],
      ["Balkon", ilan.balkon],
      ["Eşyalı", ilan.esyali],
      ["Site İçinde", ilan.siteIcinde],
      ["Aidat", ilan.aidat ? Number(ilan.aidat).toLocaleString("tr-TR") + " TL" : ""],
      ["Krediye Uygun", ilan.krediyeUygun],
      ["Tapu Durumu", ilan.tapuDurumu]
    ].filter(function(o){ return o[1]; });

    var galeriHtml =
      '<div class="galeri">' +
        '<div class="ana">' +
          (fotolar.length ? '<img id="anaFoto" src="' + kacis(fotolar[0]) + '" alt="">' : "") +
          (satildi ? '<div class="satildi-ort"><span>' + (kiralik ? "KİRALANDI" : "SATILDI") + '</span></div>' : "") +
          (fotolar.length > 1 ?
            '<button class="ok sol" id="okSol" aria-label="Önceki">‹</button>' +
            '<button class="ok sag" id="okSag" aria-label="Sonraki">›</button>' +
            '<span class="sayac" id="sayac">1 / ' + fotolar.length + '</span>' : "") +
        '</div>' +
        (fotolar.length > 1 ?
          '<div class="kucukler" id="kucukler">' +
            fotolar.map(function(f,i){ return '<img data-i="' + i + '" class="' + (i===0?"secili":"") + '" src="' + kacis(f) + '" alt="">'; }).join("") +
          '</div>' : "") +
      '</div>';

    var bilgiHtml =
      '<div class="detay-bilgi">' +
        '<div class="tipler">' +
          '<span class="tip-rozet ' + (kiralik ? "kiralik" : "satilik") + '">' + (kiralik ? "KİRALIK" : "SATILIK") + '</span>' +
          (ilan.kategori ? '<span class="tip-rozet" style="background:var(--koyu)">' + kacis(ilan.kategori).toUpperCase() + '</span>' : "") +
        '</div>' +
        '<div class="detay-fiyat">' + fiyat + '</div>' +
        '<h1>' + kacis(ilan.baslik) + '</h1>' +
        (konum ? '<div class="konum">📍 ' + kacis(konum) + '</div>' : "") +
        (ozellikler.length ?
          '<div class="ozellik-tablo">' +
            ozellikler.map(function(o){
              return '<div class="satir"><span class="ad">' + o[0] + '</span><span class="deger">' + kacis(o[1]) + '</span></div>';
            }).join("") +
          '</div>' : "") +
        (ilan.aciklama ?
          '<div class="aciklama-kutu"><h2>İlan Açıklaması</h2><div class="metin">' + kacis(ilan.aciklama) + '</div></div>' : "") +
        '<div class="danisman-kart">' +
          '<img src="gorseller/yilmaz-kanyilmaz.jpg" alt="Yılmaz Kanyılmaz">' +
          '<div class="bilgi">' +
            '<div class="ad">' + AYAR.danisman + '</div>' +
            '<div class="unvan">' + AYAR.unvan + '<br>' + AYAR.ofis + '</div>' +
          '</div>' +
          '<div class="btnler">' +
            '<a class="btn btn-kirmizi" href="tel:' + AYAR.telefon + '">Ara</a>' +
            '<a class="btn btn-yesil" target="_blank" rel="noopener" href="https://wa.me/' + AYAR.telefon.replace("+","") +
              '?text=' + encodeURIComponent("Merhaba Yılmaz Bey, \"" + ilan.baslik + "\" ilanınız hakkında bilgi almak istiyorum.") + '">WhatsApp</a>' +
          '</div>' +
        '</div>' +
        '<button class="btn btn-cerceve paylas-btn" id="paylasBtn">🔗 İlanı Paylaş</button>' +
      '</div>';

    kutu.innerHTML = galeriHtml + bilgiHtml;

    // Galeri gezinme
    if(fotolar.length > 1){
      var aktif = 0;
      var ana = document.getElementById("anaFoto");
      var sayac = document.getElementById("sayac");
      var kucukler = document.getElementById("kucukler");
      function git(i){
        aktif = (i + fotolar.length) % fotolar.length;
        ana.src = fotolar[aktif];
        sayac.textContent = (aktif+1) + " / " + fotolar.length;
        kucukler.querySelectorAll("img").forEach(function(im,j){ im.classList.toggle("secili", j===aktif); });
      }
      document.getElementById("okSol").addEventListener("click", function(){ git(aktif-1); });
      document.getElementById("okSag").addEventListener("click", function(){ git(aktif+1); });
      kucukler.addEventListener("click", function(e){
        if(e.target.dataset.i != null) git(Number(e.target.dataset.i));
      });
      // Telefonda kaydırma
      var basX = null;
      ana.parentElement.addEventListener("touchstart", function(e){ basX = e.touches[0].clientX; }, {passive:true});
      ana.parentElement.addEventListener("touchend", function(e){
        if(basX == null) return;
        var fark = e.changedTouches[0].clientX - basX;
        if(Math.abs(fark) > 40) git(fark < 0 ? aktif+1 : aktif-1);
        basX = null;
      }, {passive:true});
    }

    document.getElementById("paylasBtn").addEventListener("click", function(){
      var url = location.href;
      if(navigator.share){
        navigator.share({title: ilan.baslik, url: url});
      } else {
        navigator.clipboard.writeText(url).then(function(){
          alert("İlan bağlantısı kopyalandı.");
        });
      }
    });
  }

  fetch("veri/ilanlar.json?v=" + Date.now())
    .then(function(r){ return r.ok ? r.json() : []; })
    .then(function(veri){
      var ilan = (Array.isArray(veri) ? veri : []).find(function(i){ return i.id === id; });
      if(ilan){ goster(ilan); }
      else {
        kutu.innerHTML = '<div class="bos-durum" style="grid-column:1/-1"><div class="buyuk">İlan bulunamadı</div><div>Bu ilan kaldırılmış olabilir.</div></div>';
      }
    })
    .catch(function(){
      kutu.innerHTML = '<div class="bos-durum" style="grid-column:1/-1"><div class="buyuk">Bir hata oluştu</div></div>';
    });
})();
