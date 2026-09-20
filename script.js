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
  var topnav = document.querySelector('.topnav');

  // The menu panel is sized from the real header height rather than a
  // hardcoded value, so it never overlaps or leaves a gap on any device.
  function setNavHeight(){
    if(!topnav) return;
    document.documentElement.style.setProperty('--nav-h', topnav.offsetHeight + 'px');
  }
  setNavHeight();
  window.addEventListener('resize', setNavHeight);
  window.addEventListener('orientationchange', function(){ setTimeout(setNavHeight, 150); });
  window.addEventListener('load', setNavHeight);

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
    {faction:'chaos', label:'CHAOS SPACE MARINES', title:'Abaddon the Despoiler', painter:'Matthew Carslake', img:'assets/abaddon-despoiler.webp', color:'#2f3d6a', desc:'Warmaster Abaddon himself, Drach\'nyen alight and a fallen foe underfoot, painted in deep Black Legion blue with molten-orange flame licking up his cloak.'},
    {faction:'marines', label:'SPACE MARINES', title:'Leviathan Siege Dreadnought', painter:'Matthew Carslake', img:'assets/leviathan-dreadnought.webp', color:'#2f4a8a', desc:'A Leviathan Pattern Dreadnought armed with a storm cannon array and siege claw, painted in bold Ultramarine blue with crisp edge highlighting and a suitably grim basing scene.'},
    {faction:'chaos', label:'DISCIPLES OF TZEENTCH', title:'Tzaangor Enlightened', painter:'Matthew Carslake', img:'assets/tzaangor-enlightened.webp', color:'#5a2d8a', desc:'A Tzaangor Enlightened riding its Disc of Tzeentch, painted in rich purples and teal with contrasting bronze weaponry and a lava-cracked stone base.'},
    {faction:'chaos', label:'CHAOS KNIGHTS', title:'Knight Abominant', painter:'Matthew Carslake', img:'assets/knight-abominant-i.webp', color:'#5a6b2e', desc:'The first knight of Matthew\'s traitor household, painted in bone, black, and acid-green flame, with rust and blood weathering worked into every panel line and chain-hung trophy skull.'},
    {faction:'chaos', label:'CHAOS KNIGHTS', title:'Knight Abominant II', painter:'Matthew Carslake', img:'assets/knight-abominant-ii.webp', color:'#5a6b2e', desc:'The household\'s second knight, armed with twin rainbow-glazed cannons and standing on a cracked lava base that matches the rest of the force.'},
    {faction:'chaos', label:'CHAOS KNIGHTS', title:'Knight Abominant III', painter:'Matthew Carslake', img:'assets/knight-abominant-iii.webp', color:'#5a6b2e', desc:'Household knight the third, wielding a heavy conversion beamer and chain-flail, marked with the household\'s numeral sigil across shield and banner alike.'},
    {faction:'chaos', label:'CHAOS KNIGHTS', title:'Knight Abominant IV, "Iratus"', painter:'Matthew Carslake', img:'assets/knight-abominant-iv.webp', color:'#5a6b2e', desc:'The named champion of the household, "Iratus" — twin havoc launchers, a blood-stained banner, and daemon familiars perched across its carapace.'},
    {faction:'chaos', label:'CHAOS DAEMONS', title:'Kairos Fateweaver', painter:'Matthew Carslake', img:'assets/kairos-fateweaver.webp', color:'#2f6a8a', desc:'The two-headed Lord of Change himself, painted in Tzeentchian teal and bronze with a wet-blend across every feather of his vast wings.'},
    {faction:'chaos', label:'CHAOS SPACE MARINES', title:'Dark Apostle', painter:'Matthew Carslake', img:'assets/dark-apostle.webp', color:'#2f4a6a', desc:'A Word Bearers Dark Apostle mid-sermon, tome ablaze and crozius raised, finished in deep blues with hand-lettered scripture running down his stole.'},
    {faction:'chaos', label:'CHAOS DAEMONS', title:'Kytan Ravager', painter:'Matthew Carslake', img:'assets/kytan-ravager.webp', color:'#3a4a5a', desc:'A brass-and-shadow engine of Khorne, painted with cold, industrial blues to make its furnace-red details burn even brighter by contrast.'},
    {faction:'marines', label:'SPACE WOLVES', title:'Logan Grimnar, Great Wolf', painter:'Steven John Ovens', img:'assets/logan-grimnar.webp', color:'#c41e2a', desc:'Steven\'s competition entry — Logan Grimnar flanked by Fenrisian wolves, with freehand frost effects on the axe, layered fur work, and a fully sculpted rocky base. Painted ahead of Leman Russ\'s long-awaited return to 40k.'},
    {faction:'marines', label:'SPACE WOLVES', title:'Bjorn the Fell-Handed', painter:'Steven John Ovens', img:'assets/bjorn-fell-handed.webp', color:'#4a6a8a', desc:'The legendary Dreadnought of the Space Wolves, painted by Steven in the chapter\'s icy blue and gold, with a hand-painted wolf pelt drape and cracked-ice basing to match the rest of his Fenrisian force.'},
    {faction:'marines', label:'SPACE WOLVES', title:'The Great Company Assembles', painter:'Steven John Ovens', img:'assets/space-wolves-army.webp', color:'#4a6a8a', desc:'Steven\'s full Space Wolves force on parade — three Dreadnoughts, a full pack of Fenrisian wolves, and squad after squad of Blood Claws and Grey Hunters, all painted to a single, cohesive icy palette.'},
    {faction:'marines', label:'SPACE WOLVES', title:'Redemptor Dreadnought', painter:'Steven John Ovens', img:'assets/redemptor-dreadnought.webp', color:'#4a6a8a', desc:'A heavy-hitting Redemptor, finished in the pack\'s signature blue and gold with a hand-painted wolf-head icon and warning chevrons picked out in red and yellow.'},
    {faction:'marines', label:'SPACE WOLVES', title:'Venerable Dreadnought', painter:'Steven John Ovens', img:'assets/venerable-dreadnought.webp', color:'#4a6a8a', desc:'An ancient Venerable Dreadnought armed with a frost axe and storm shield, its armour hung with trophies and painted runes, standing on cracked permafrost basing.'},
    {faction:'marines', label:'SPACE WOLVES', title:'Chaplain on Bike', painter:'Steven John Ovens', img:'assets/chaplain-on-bike.webp', color:'#2f3d4a', desc:'A Primaris Chaplain riding out on his war-bike, crozius raised and a wolf-pelt trophy lashed to the front — a dark, cathedral-grey scheme with gold reliquary trim.'},
    {faction:'marines', label:'SPACE MARINES', title:'Chaplain with Jump Pack', painter:'Steven John Ovens', img:'assets/chaplain-jumppack.webp', color:'#2f3d4a', desc:'A dynamic jump-pack Chaplain caught mid-leap, with hand-painted black wings, skull iconography, and copper trim built up in thin glazes for real metallic depth.'},
    {faction:'custodes', label:'ADEPTUS CUSTODES', title:'Shield-Captain and Custodian Guard', painter:'Steven John Ovens', img:'assets/custodes-guard.webp', color:'#8a1a1a', desc:'A Shield-Captain and Custodian Guard, painted in deep red and green with a rainbow-gradient effect freehanded onto every energy blade — now something of a signature technique for Steven.'},
    {faction:'custodes', label:'ADEPTUS CUSTODES', title:'Custodes Vexilla Detachment', painter:'Steven John Ovens', img:'assets/custodes-vexilla.webp', color:'#8a1a1a', desc:'Twin Custodian Guards flanking a vexilla bearer, its feathered standard picked out in the same prismatic gradient as the rest of the detachment\'s weapons.'},
    {faction:'custodes', label:'ADEPTUS CUSTODES', title:'Custodes Grav-Cavalry', painter:'Steven John Ovens', img:'assets/custodes-jetbike.webp', color:'#8a1a1a', desc:'A Custodian outrider on grav-cavalry, lance held high and glowing with the same rainbow energy effect Steven\'s carried across his entire Custodes force.'},
    {faction:'seraphon', label:'SERAPHON', title:'Saurus Oldblood on Carnosaur', painter:'Devin Du Plessis', img:'assets/saurus-oldblood-carnosaur.webp', color:'#8a1a1a', desc:'A Saurus Oldblood riding to war on his Carnosaur, painted in deep crimson scales with black striping and a fully scratch-built jungle base, complete with hand-painted foliage and celestite crystals.'},
    {faction:'seraphon', label:'SERAPHON', title:'Slann Starmaster', painter:'Devin Du Plessis', img:'assets/slann-starmaster.webp', color:'#3a6a3a', desc:'The Starmaster on his palanquin, attended by skink retainers, painted in vivid jungle greens and golds with an intricate celestial-blue glow worked into every rune and crystal.'},
    {faction:'chaos', label:'DEATH GUARD', title:'Mortarion, Daemon Primarch of Nurgle', painter:'Sjoerd Leister', img:'assets/mortarion.webp', color:'#3a4a3a', desc:'The Death Guard\'s Primarch in his full daemonic ascension, painted in muted decaying greens and bone, with his scythe\'s inner flame picked out in a hot, glowing orange for contrast against the rot.'},
    {faction:'chaos', label:'CHAOS DAEMONS', title:'Be\'lakor, the Dark Master', painter:'Devin Du Plessis', img:'assets/belakor.webp', color:'#6a2d6e', desc:'Be\'lakor, the first Daemon Prince, raised to power by the four Chaos Gods and later cursed to rule only from the shadows. Devin\'s version pairs violet-to-amber wings with a molten lava base and a spectral green blade.'},
    {faction:'orks', label:'ORKS', title:'Beastboss', painter:'Oliver Bilson', img:'assets/beastboss.webp', color:'#4a6b2e', desc:'A Beastboss with his squighound in tow, painted in classic Ork green with rusted metal plating and a desert-red basing scheme finished off with a scattering of purple tufts and cacti.'},
    {faction:'tyranids', label:'TYRANIDS', title:'Winged Hive Tyrant', painter:'Gabriel Goddard', img:'assets/hive-tyrant.webp', color:'#8a6a1a', desc:'A Winged Hive Tyrant finished in bronze and gold carapace over a bone-white underbelly, with a striking electric-blue glow carried through every talon and bio-weapon tip.'}
  ];

  var galleryGrid = document.getElementById('galleryGrid');
  if(galleryGrid){
    ARMY_DATA.forEach(function(item, idx){
      var card = document.createElement('div');
      card.className = 'gcard show';
      card.dataset.faction = item.faction;
      card.dataset.idx = idx;
      var artInner = item.img
        ? '<div class="art has-photo"><img src="'+item.img+'" alt="'+item.title+' painted by '+item.painter+'" loading="lazy"></div>'
        : '<div class="art" style="background:radial-gradient(circle at 50% 40%, '+item.color+'33, #0d0707 70%)">'+
            '<svg style="color:'+item.color+'"><use href="#'+item.icon+'"/></svg>'+
          '</div>';
      card.innerHTML =
        artInner +
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
        var lbArt = document.getElementById('lbArt');
        if(item.img){
          lbArt.className = 'art has-photo';
          lbArt.innerHTML = '<img src="'+item.img+'" alt="'+item.title+' painted by '+item.painter+'">';
        } else {
          lbArt.className = 'art';
          lbArt.innerHTML = '<svg viewBox="0 0 100 100" style="color:'+item.color+'"><use href="#'+item.icon+'"/></svg>';
        }
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
