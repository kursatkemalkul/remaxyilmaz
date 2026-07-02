// Ana sayfa — ilanları yükler ve listeler
(function(){
  var ilanlar = [];
  var aktifFiltre = "hepsi";

  // İletişim bağlantılarını doldur
  document.getElementById("yil").textContent = new Date().getFullYear();
  var telHref = "tel:" + AYAR.telefon;
  var waHref = "https://wa.me/" + AYAR.telefon.replace("+","") + "?text=" + encodeURIComponent(AYAR.whatsappMesaj);
  document.getElementById("ustAraBtn").href = telHref;
  document.getElementById("heroWhatsapp").href = waHref;
  document.getElementById("iletisimTel").href = telHref;
  document.getElementById("iletisimTelYazi").textContent = AYAR.telefonGoster;
  document.getElementById("iletisimOfisTel").href = "tel:" + AYAR.ofisTel;
  document.getElementById("iletisimOfisYazi").textContent = AYAR.ofisTelGoster;
  document.getElementById("iletisimEposta").href = "mailto:" + AYAR.eposta;
  document.getElementById("iletisimEpostaYazi").textContent = AYAR.eposta;
  document.getElementById("iletisimAdres").textContent = "📍 " + AYAR.adres;
  document.getElementById("iletisimAraBtn").href = telHref;
  document.getElementById("iletisimWhatsapp").href = waHref;
  document.getElementById("iletisimMailBtn").href = "mailto:" + AYAR.eposta;
  document.getElementById("sosyalInstagram").href = AYAR.instagram;
  document.getElementById("sosyalYoutube").href = AYAR.youtube;
  document.getElementById("sosyalLinkedin").href = AYAR.linkedin;

  function fiyatYaz(ilan){
    var f = Number(ilan.fiyat) || 0;
    var yazi = f.toLocaleString("tr-TR") + " TL";
    if(ilan.tip === "kiralik") yazi += ' <span class="donem">/ ay</span>';
    return yazi;
  }

  function kartOlustur(ilan){
    var kapak = (ilan.fotograflar && ilan.fotograflar.length) ? ilan.fotograflar[0] : "";
    var satildi = ilan.durum === "satildi";
    var ozet = [];
    if(ilan.m2brut) ozet.push(ilan.m2brut + " m²");
    if(ilan.odaSayisi) ozet.push(ilan.odaSayisi);
    if(ilan.bulunduguKat) ozet.push(ilan.bulunduguKat + ". kat");
    var konum = [ilan.mahalle, ilan.ilce, ilan.il].filter(Boolean).join(", ");
    return '<a class="ilan-kart" href="ilan.html?id=' + encodeURIComponent(ilan.id) + '">' +
      '<div class="foto">' +
        '<span class="tip-rozet ' + (ilan.tip === "kiralik" ? "kiralik" : "satilik") + '">' + (ilan.tip === "kiralik" ? "KİRALIK" : "SATILIK") + '</span>' +
        (kapak ? '<img loading="lazy" src="' + kapak + '" alt="">' : "") +
        (satildi ? '<div class="satildi-ort"><span>' + (ilan.tip === "kiralik" ? "KİRALANDI" : "SATILDI") + '</span></div>' : "") +
      '</div>' +
      '<div class="icerik">' +
        '<div class="fiyat">' + fiyatYaz(ilan) + '</div>' +
        '<h3>' + (ilan.baslik || "") + '</h3>' +
        (konum ? '<div class="konum">📍 ' + konum + '</div>' : "") +
        (ozet.length ? '<div class="ozet"><span>' + ozet.join("</span><span>") + '</span></div>' : "") +
      '</div>' +
    '</a>';
  }

  function listele(){
    var izgara = document.getElementById("ilanIzgara");
    var bos = document.getElementById("bosDurum");
    var liste = ilanlar.filter(function(i){
      if(aktifFiltre === "hepsi") return i.durum !== "satildi";
      if(aktifFiltre === "satildi") return i.durum === "satildi";
      return i.tip === aktifFiltre && i.durum !== "satildi";
    });
    liste.sort(function(a,b){ return (b.tarih||0) - (a.tarih||0); });
    izgara.innerHTML = liste.map(kartOlustur).join("");
    bos.classList.toggle("gizli", liste.length > 0);
  }

  document.getElementById("filtreler").addEventListener("click", function(e){
    var btn = e.target.closest(".filtre");
    if(!btn) return;
    document.querySelectorAll("#filtreler .filtre").forEach(function(b){ b.classList.remove("secili"); });
    btn.classList.add("secili");
    aktifFiltre = btn.dataset.filtre;
    listele();
  });

  fetch("veri/ilanlar.json?v=" + Date.now())
    .then(function(r){ return r.ok ? r.json() : []; })
    .then(function(veri){
      ilanlar = Array.isArray(veri) ? veri : [];
      var aktif = ilanlar.filter(function(i){ return i.durum !== "satildi"; }).length;
      var satilan = ilanlar.length - aktif;
      document.getElementById("istAktif").textContent = aktif;
      document.getElementById("istSatilan").textContent = satilan > 0 ? satilan + "+" : "—";
      listele();
    })
    .catch(function(){
      document.getElementById("istAktif").textContent = "0";
      document.getElementById("istSatilan").textContent = "—";
      listele();
    });
})();
