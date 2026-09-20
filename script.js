(function(){
  "use strict";

  document.documentElement.classList.add('js');
  window.addEventListener('load', function(){ document.body.classList.add('loaded'); });

  /* ---------- ACTIVE NAV LINK ---------- */
  var current = document.body.getAttribute('data-page');
  document.querySelectorAll('.navlinks a[data-page]').forEach(function(a){
    if(a.getAttribute('data-page') === current) a.classList.add('active');
  });

  /* ---------- MOBILE NAV ---------- */
  var burgerBtn = document.getElementById('burgerBtn');
  var navlinks = document.getElementById('navlinks');
  if(burgerBtn && navlinks){
    burgerBtn.addEventListener('click', function(){
      var open = navlinks.classList.toggle('open');
      burgerBtn.setAttribute('aria-expanded', open ? 'true':'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // Close the menu (and restore scrolling) when a link is tapped
    navlinks.addEventListener('click', function(e){
      if(e.target.closest('a')){
        navlinks.classList.remove('open');
        burgerBtn.setAttribute('aria-expanded','false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- EMBERS ---------- */
  var emberHost = document.getElementById('emberHost');
  if(emberHost){
    var EMBER_COUNT = 26;
    for (var i=0;i<EMBER_COUNT;i++){
      var e = document.createElement('span');
      e.className = 'ember';
      var size = 2 + Math.random()*5;
      e.style.width = size+'px';
      e.style.height = size+'px';
      e.style.left = (Math.random()*100)+'%';
      e.style.setProperty('--drift', (Math.random()*80-40)+'px');
      var dur = 7 + Math.random()*9;
      e.style.animationDuration = dur+'s';
      e.style.animationDelay = (Math.random()*dur)+'s';
      emberHost.appendChild(e);
    }
  }

  /* ---------- GALLERY DATA (used on gallery.html) ---------- */
  var ARMY_DATA = [
    {faction:'marines', label:'SPACE MARINES', title:'Iron Heralds 2nd Company', painter:'Marika "Ironbrow" Voss', icon:'ico-marine', color:'#c41e2a', desc:'A full 2000-point company painted over eight months, with hand-freehanded ember trim on every shoulder pad. Club spring league champion.'},
    {faction:'guard', label:'ASTRA MILITARUM', title:'147th Kasrite Rifles', painter:'Cole Ferreira', icon:'ico-tank', color:'#8a6a3a', desc:'A tank-heavy Militarum force built around three Leman Russ variants, weathered with a sponge-chipping technique Cole teaches at clinic nights.'},
    {faction:'orks', label:'ORKS', title:'Da Scrapjaw Boyz', painter:'Jonah Pratt', icon:'ico-ork', color:'#5a6b2e', desc:'Built almost entirely from converted bits and kitbashes traded across the club table. Loud green, louder attitude.'},
    {faction:'necrons', label:'NECRONS', title:'Ashkatep Dynasty', painter:'Ines Calder', icon:'ico-necron', color:'#8a7a4a', desc:'A slow-and-steady project — three years in the making — with a signature verdigris wash technique on every warrior.'},
    {faction:'tyranids', label:'TYRANIDS', title:'Hive Fleet Umbra', painter:'Wren Ashby', icon:'ico-tyranid', color:'#6a2d6e', desc:'Started as three test models. Now a full swarm using a wet-blend carapace technique that took a year to get right.'},
    {faction:'chaos', label:'CHAOS', title:'The Ashen Covenant', painter:'Lena Fischer', icon:'ico-chaos', color:'#c41e2a', desc:'A warband painted in cracked-earth textures and rust glazes, built to look like it clawed its way out of the underworld.'},
    {faction:'marines', label:'SPACE MARINES', title:'Sable Wardens 4th Squad', painter:'Malik Osei', icon:'ico-marine', color:'#5a4040', desc:'A tactical squad finished with an NMM (non-metallic metal) technique Malik picked up from a club clinic last spring.'},
    {faction:'guard', label:'ASTRA MILITARUM', title:'Vostroyan 9th Line', painter:'Théo Marchand', icon:'ico-tank', color:'#7a5a2e', desc:'An infantry-heavy regiment painted for tabletop speed — a full 40-model platoon finished start to finish in one long weekend.'},
    {faction:'necrons', label:'NECRONS', title:'Thaxus Silent Legion', painter:'Devon Okafor', icon:'ico-necron', color:'#3a4a4a', desc:'Painted with a cool teal glow effect on every weapon, built as the centerpiece of the club\'s display cabinet.'},
    {faction:'tyranids', label:'TYRANIDS', title:'Broodswarm Kaelis', painter:'Priya Anand', icon:'ico-tyranid', color:'#3a6a4a', desc:'A gribbly, bio-luminescent paint scheme demoed live at the club\'s annual paint-off — now the house style half the club borrows.'},
    {faction:'chaos', label:'CHAOS', title:'Warband of the Cracked Eye', painter:'Sam Reyes', icon:'ico-chaos', color:'#8a1220', desc:'A small but mean eight-model warband, each piece given its own freehand icon — no two models share a symbol.'},
    {faction:'orks', label:'ORKS', title:'Bloodgrin Speed Freeks', painter:'Ines Calder', icon:'ico-ork', color:'#8a5a1f', desc:'A vehicle-only Ork force built for speed on the table and chaos off it — buggies, bikes, and one extremely illegal trukk conversion.'}
  ];

  var galleryGrid = document.getElementById('galleryGrid');
  if(galleryGrid){
    ARMY_DATA.forEach(function(item, idx){
      var card = document.createElement('div');
      card.className = 'gcard show';
      card.dataset.faction = item.faction;
      card.dataset.idx = idx;
      card.innerHTML =
        '<div class="art" style="background:radial-gradient(circle at 50% 40%, '+item.color+'33, #0d0707 70%)">'+
          '<svg style="color:'+item.color+'"><use href="#'+item.icon+'"/></svg>'+
        '</div>'+
        '<div class="meta">'+
          '<div class="faction">'+item.label+'</div>'+
          '<h4>'+item.title+'</h4>'+
          '<div class="painter">by '+item.painter+'</div>'+
        '</div>';
      galleryGrid.appendChild(card);
    });

    var filterRow = document.getElementById('filterRow');
    if(filterRow){
      filterRow.addEventListener('click', function(e){
        var btn = e.target.closest('.filter-btn');
        if(!btn) return;
        filterRow.querySelectorAll('.filter-btn').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active');
        var f = btn.dataset.filter;
        galleryGrid.querySelectorAll('.gcard').forEach(function(c){
          c.classList.toggle('show', f==='all' || c.dataset.faction===f);
        });
      });
    }

    var lightbox = document.getElementById('lightbox');
    if(lightbox){
      galleryGrid.addEventListener('click', function(e){
        var card = e.target.closest('.gcard');
        if(!card) return;
        var item = ARMY_DATA[+card.dataset.idx];
        document.getElementById('lbArt').innerHTML = '<svg viewBox="0 0 100 100" style="color:'+item.color+'"><use href="#'+item.icon+'"/></svg>';
        document.getElementById('lbFaction').textContent = item.label;
        document.getElementById('lbTitle').textContent = item.title;
        document.getElementById('lbDesc').textContent = item.desc;
        document.getElementById('lbPainter').textContent = 'Painted by '+item.painter;
        lightbox.classList.add('open');
      });
      var lbClose = document.getElementById('lbClose');
      if(lbClose) lbClose.addEventListener('click', function(){lightbox.classList.remove('open');});
      lightbox.addEventListener('click', function(e){ if(e.target===lightbox) lightbox.classList.remove('open'); });
      document.addEventListener('keydown', function(e){ if(e.key==='Escape') lightbox.classList.remove('open'); });
    }
  }

  /* ---------- HOME PHOTO GALLERY LIGHTBOX ---------- */
  var photoGrid = document.getElementById('photoGrid');
  var photoLightbox = document.getElementById('photoLightbox');
  if(photoGrid && photoLightbox){
    var plbImg = document.getElementById('plbImg');
    var plbCap = document.getElementById('plbCap');
    photoGrid.addEventListener('click', function(e){
      var card = e.target.closest('.photo-card');
      if(!card) return;
      var img = card.querySelector('img');
      plbImg.src = img.src;
      plbImg.alt = img.alt;
      plbCap.textContent = card.dataset.caption || img.alt || '';
      photoLightbox.classList.add('open');
    });
    var plbClose = document.getElementById('plbClose');
    if(plbClose) plbClose.addEventListener('click', function(){ photoLightbox.classList.remove('open'); });
    photoLightbox.addEventListener('click', function(e){ if(e.target===photoLightbox) photoLightbox.classList.remove('open'); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') photoLightbox.classList.remove('open'); });
  }

  /* ---------- FAQ ACCORDION ---------- */
  var faqList = document.getElementById('faqList');
  if(faqList){
    faqList.addEventListener('click', function(e){
      var q = e.target.closest('.faq-q');
      if(!q) return;
      var item = q.parentElement;
      var wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(function(fi){
        fi.classList.remove('open');
        fi.querySelector('.faq-a').style.maxHeight = null;
      });
      if(!wasOpen){
        item.classList.add('open');
        var a = item.querySelector('.faq-a');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  }

  /* ---------- JOIN FORM (static demo) ---------- */
  var joinForm = document.getElementById('joinForm');
  if(joinForm){
    joinForm.addEventListener('submit', function(e){
      e.preventDefault();
      document.getElementById('formNote').textContent = 'Thanks — your message is queued for an officer. (Demo form: nothing is actually sent yet.)';
      this.reset();
    });
  }

  /* ---------- SCROLL REVEAL ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in-view'); io.unobserve(en.target); }
    });
  }, {threshold:.12}) : null;

  document.querySelectorAll('.reveal').forEach(function(el){
    if(io){ io.observe(el); } else { el.classList.add('in-view'); }
  });

})();
