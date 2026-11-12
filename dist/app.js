import{invitationIdFromPath,adaptXanoInvitation,createGuestPatch}from'./backend-adapter.js?v=1';

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const validMapUrl=value=>{try{const url=new URL(String(value||''));return ['http:','https:'].includes(url.protocol)?url.href:''}catch{return''}};
const copy={
  ru:{invitation:'ПРИГЛАШЕНИЕ НА СВАДЬБУ',and:'и',scroll:'ЛИСТАЙТЕ ВНИЗ',dear:'ДОРОГИЕ РОДНЫЕ И ДРУЗЬЯ',dateTitle:'НАША ДАТА',addCalendar:'Добавить в календарь',wishLabel:'ОТ НАС',program:'ПРОГРАММА ДНЯ',programTitle:'Волна за волной —<br><i>к нашему вечеру</i>',venue:'МЕСТО ПРОВЕДЕНИЯ',rsvpTitle:'Будете ли вы<br><i>с нами?</i>',rsvpText:'Пожалуйста, сообщите о вашем решении.',nameLabel:'ВАШЕ ИМЯ',attendLabel:'ВЫ СМОЖЕТЕ ПРИЙТИ?',yes:'С радостью буду!',no:'К сожалению, не получится',countLabel:'КОЛИЧЕСТВО ГОСТЕЙ',wishInput:'ПОЖЕЛАНИЕ',send:'ПОДТВЕРДИТЬ ПРИСУТСТВИЕ',waiting:'С ЛЮБОВЬЮ ЖДЁМ ВАС',countdownTitle:'ДО НАШЕЙ СВАДЬБЫ',days:'ДНЕЙ',hours:'ЧАСОВ',minutes:'МИНУТ',seconds:'СЕКУНД',sent:'Спасибо! Ваш ответ сохранён.',failed:'Не удалось сохранить ответ.',loading:'Сохраняем…',loadError:'Не удалось загрузить данные',retry:'Повторить',week:['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС']},
  ky:{invitation:'ҮЙЛӨНҮҮ ТОЮНА ЧАКЫРУУ',and:'жана',scroll:'ТӨМӨН ЖЫЛДЫРЫҢЫЗ',dear:'УРМАТТУУ ТУУГАНДАР ЖАНА ДОСТОР',dateTitle:'БИЗДИН КҮН',addCalendar:'Календарга кошуу',wishLabel:'БИЗДЕН',program:'КҮНДҮН ПРОГРАММАСЫ',programTitle:'Толкун артынан толкун —<br><i>биздин кечке</i>',venue:'ӨТКӨРҮҮ ЖЕРИ',rsvpTitle:'Биз менен<br><i>болосузбу?</i>',rsvpText:'Чечимиңизди билдирип коюңуз.',nameLabel:'АТЫҢЫЗ',attendLabel:'КЕЛЕ АЛАСЫЗБЫ?',yes:'Кубаныч менен келем!',no:'Тилекке каршы, келе албайм',countLabel:'КОНОКТОРДУН САНЫ',wishInput:'КААЛОО-ТИЛЕК',send:'КАТЫШУУНУ ЫРАСТОО',waiting:'СҮЙҮҮ МЕНЕН КҮТӨБҮЗ',countdownTitle:'ҮЙЛӨНҮҮ ТОЮБУЗГА ЧЕЙИН',days:'КҮН',hours:'СААТ',minutes:'МҮНӨТ',seconds:'СЕКУНДА',sent:'Рахмат! Жообуңуз сакталды.',failed:'Жооп сакталган жок.',loading:'Сакталууда…',loadError:'Маалымат жүктөлгөн жок',retry:'Кайталоо',week:['ДШ','ШШ','ШР','БШ','ЖМ','ИШ','ЖК']},
  kk:{invitation:'ҮЙЛЕНУ ТОЙЫНА ШАҚЫРУ',and:'және',scroll:'ТӨМЕН ЖЫЛЖЫТЫҢЫЗ',dear:'ҚҰРМЕТТІ ТУЫСТАР МЕН ДОСТАР',dateTitle:'БІЗДІҢ КҮН',addCalendar:'Күнтізбеге қосу',wishLabel:'БІЗДЕН',program:'КҮН БАҒДАРЛАМАСЫ',programTitle:'Толқыннан толқынға —<br><i>біздің кешке</i>',venue:'ӨТЕТІН ОРНЫ',rsvpTitle:'Бізбен бірге<br><i>боласыз ба?</i>',rsvpText:'Шешіміңізді хабарлаңыз.',nameLabel:'СІЗДІҢ АТЫҢЫЗ',attendLabel:'ТОЙҒА КЕЛЕ АЛАСЫЗ БА?',yes:'Қуана келемін!',no:'Өкінішке қарай, келе алмаймын',countLabel:'ҚОНАҚТАР САНЫ',wishInput:'ТІЛЕК',send:'ҚАТЫСУДЫ РАСТАУ',waiting:'СҮЙІСПЕНШІЛІКПЕН КҮТЕМІЗ',countdownTitle:'ҮЙЛЕНУ ТОЙЫМЫЗҒА ДЕЙІН',days:'КҮН',hours:'САҒАТ',minutes:'МИНУТ',seconds:'СЕКУНД',sent:'Рақмет! Жауабыңыз сақталды.',failed:'Жауап сақталмады.',loading:'Сақталуда…',loadError:'Деректер жүктелмеді',retry:'Қайталау',week:['ДС','СС','СР','БС','ЖМ','СБ','ЖС']}
};

let fallback,config,record,id,calendarCursor,observer,countdownTimer;
let language=localStorage.getItem('pearl-wave-language')||'ru';
const t=key=>copy[language]?.[key]||copy.ru[key]||key;
const locale=()=>config.locales?.[language]||config.locales?.[config.defaultLanguage]||config.locales?.ru;
const localeCode=()=>language==='ky'?'ky-KG':language==='kk'?'kk-KZ':'ru-RU';
const dateObject=()=>new Date(config.date);

async function load(){
  fallback=await fetch('content.json').then(response=>response.json());
  id=invitationIdFromPath(location.pathname,fallback.backend.defaultId);
  try{
    if(!id)throw new Error('invalid-id');
    const response=await fetch(`${fallback.backend.baseUrl}/${id}`,{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok)throw new Error('load-failed');
    record=await response.json();
    config=adaptXanoInvitation(record,fallback);
    $('#dataError').hidden=true;
  }catch{
    record=null;
    config=fallback;
    $('#dataError').hidden=false;
  }
  const enabled=config.enabledLanguages||['ru'];
  if(!enabled.includes(language))language=config.defaultLanguage||enabled[0];
  $$('[data-lang]').forEach(button=>button.hidden=!enabled.includes(button.dataset.lang));
  $('#languageToggle').hidden=enabled.length<2;
  calendarCursor=dateObject();
  render();
}

function dateText(options){return new Intl.DateTimeFormat(localeCode(),{timeZone:config.timezone||'Asia/Bishkek',...options}).format(dateObject()).replace(' г.','')}
function safe(value){const node=document.createElement('div');node.textContent=String(value||'');return node.innerHTML}

function render(){
  document.documentElement.lang=language;
  $$('[data-i18n]').forEach(node=>node.innerHTML=t(node.dataset.i18n));
  $$('[data-lang]').forEach(button=>button.classList.toggle('active',button.dataset.lang===language));
  $('.language-menu__current').textContent=language==='ky'?'KG':language==='kk'?'KZ':'RU';
  const names=config.names;
  $('#heroFirst').textContent=$('#footerFirst').textContent=names.first;
  $('#heroSecond').textContent=$('#footerSecond').textContent=names.second;
  $('.hero__names').classList.toggle('long',(names.first+names.second).length>17);
  $('#heroDay').textContent=dateText({day:'2-digit'});
  $('#heroMonth').textContent=dateText({month:'long'}).toUpperCase();
  $('#heroYear').textContent=dateText({year:'numeric'});
  const current=locale();
  $('#welcomeTitle').textContent=current.welcomeTitle||t('dear');
  $('#welcomeText').textContent=current.welcome||'';
  $('#hostsText').textContent=current.hosts||'';
  $('#eventList').replaceChildren(...(current.schedule||[]).map(event=>{const item=document.createElement('li');item.className='event-item reveal';item.innerHTML=`<time class="event-time">${safe(event.time)}</time><h3>${safe(event.title)}</h3><p>${safe(event.description)}</p>`;return item}));
  const wish=$('#wishBlock');wish.hidden=!config.wishBlock?.enabled;if(!wish.hidden){$('#wishBlockTitle').textContent=current.wishTitle||'';$('#wishBlockText').textContent=current.wishText||''}
  $('#venueType').textContent=current.venue?.type||'';$('#venueName').textContent=current.venue?.name||'';$('#venueAddress').textContent=current.venue?.address||'';
  const query=[current.venue?.name,current.venue?.address].filter(Boolean).join(', ');
  const google=validMapUrl(config.map?.googleUrl)||(query?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`:'');
  const twoGis=validMapUrl(config.map?.twoGisUrl)||(query?`https://2gis.kg/search/${encodeURIComponent(query)}`:'');
  $('.map-buttons').hidden=!(google||twoGis);$('#googleMapLink').hidden=!google;$('#twoGisLink').hidden=!twoGis;$('#googleMapLink').href=google||'#';$('#twoGisLink').href=twoGis||'#';
  $('#rsvp').hidden=config.rsvp?.enabled===false;$('#guestWishField').hidden=config.rsvp?.allowGuestWish===false;
  configureGuestCount();renderCalendar();startCountdown();observe();
  document.title=`${names.first} & ${names.second} — ${dateText({day:'numeric',month:'long',year:'numeric'})}`;
  $('meta[name="description"]').content=`${current.welcomeTitle||t('invitation')} — ${names.first} & ${names.second}`;
}

function renderCalendar(){
  const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth(),wedding=dateObject();
  $('#calendarTitle').innerHTML=`${new Intl.DateTimeFormat(localeCode(),{month:'long'}).format(calendarCursor)} <i>${year}</i>`;
  $('#calendarWeek').replaceChildren(...t('week').map(value=>Object.assign(document.createElement('span'),{textContent:value})));
  const first=(new Date(year,month,1).getDay()+6)%7,count=new Date(year,month+1,0).getDate(),cells=[];
  for(let index=0;index<first;index++){const cell=document.createElement('span');cell.className='empty';cells.push(cell)}
  for(let day=1;day<=count;day++){const cell=document.createElement('span');cell.textContent=day;if(year===wedding.getFullYear()&&month===wedding.getMonth()&&day===wedding.getDate())cell.className='wedding';cells.push(cell)}
  $('#calendarDays').replaceChildren(...cells);
}

function configureGuestCount(){const select=$('#guestCount'),max=config.rsvp?.maxGuests||10;select.replaceChildren(...Array.from({length:max},(_,index)=>Object.assign(document.createElement('option'),{value:String(index+1),textContent:String(index+1)})))}
function startCountdown(){
  clearInterval(countdownTimer);
  const update=()=>{
    const remaining=Math.max(0,dateObject().getTime()-Date.now());
    const days=Math.floor(remaining/86400000),hours=Math.floor(remaining/3600000)%24,minutes=Math.floor(remaining/60000)%60,seconds=Math.floor(remaining/1000)%60;
    $('#countdownDays').textContent=String(days).padStart(3,'0');
    $('#countdownHours').textContent=String(hours).padStart(2,'0');
    $('#countdownMinutes').textContent=String(minutes).padStart(2,'0');
    $('#countdownSeconds').textContent=String(seconds).padStart(2,'0');
  };
  update();countdownTimer=setInterval(update,1000);
}
function observe(){observer?.disconnect();if(!('IntersectionObserver'in window)){$$('.reveal').forEach(node=>node.classList.add('visible'));return}observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});$$('.reveal:not(.visible)').forEach(node=>observer.observe(node))}

const languageMenu=$('.language-menu'),languageToggle=$('.language-menu__toggle');
languageToggle.addEventListener('click',()=>{const open=languageMenu.classList.toggle('is-open');languageToggle.setAttribute('aria-expanded',String(open))});
document.addEventListener('click',event=>{if(!languageMenu.contains(event.target)){languageMenu.classList.remove('is-open');languageToggle.setAttribute('aria-expanded','false')}});
$$('[data-lang]').forEach(button=>button.addEventListener('click',()=>{language=button.dataset.lang;localStorage.setItem('pearl-wave-language',language);render();languageMenu.classList.remove('is-open');languageToggle.setAttribute('aria-expanded','false')}));

$('#calendarDownload').addEventListener('click',()=>{const compact=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const venue=locale().venue||{},text=`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${compact(config.date)}\nDTEND:${compact(config.endDate)}\nSUMMARY:${config.names.first} & ${config.names.second}\nLOCATION:${venue.address||''}\nEND:VEVENT\nEND:VCALENDAR`,link=document.createElement('a');link.href=URL.createObjectURL(new Blob([text],{type:'text/calendar'}));link.download='wedding.ics';link.click();URL.revokeObjectURL(link.href)});
$$('input[name="attending"]').forEach(input=>input.addEventListener('change',()=>$('#guestCountWrap').hidden=$('input[name="attending"]:checked').value==='no'));

$('#rsvpForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=$('#submitRsvp'),status=$('#formStatus'),attending=$('input[name="attending"]:checked').value==='yes';
  const guest={name:$('#guestName').value,wish:$('#guestWish').value,guests_count:attending?Number($('#guestCount').value):0,is_attending:attending};
  button.disabled=true;status.textContent=t('loading');
  try{
    if(!record)throw new Error('demo');
    const latestResponse=await fetch(`${fallback.backend.baseUrl}/${id}`,{cache:'no-store'});if(!latestResponse.ok)throw new Error('latest');
    const latest=await latestResponse.json(),body=createGuestPatch(latest,id,guest);
    const response=await fetch(`${fallback.backend.baseUrl}/${id}/full`,{method:'PATCH',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});if(!response.ok)throw new Error('save');
    record=body;config=adaptXanoInvitation(record,fallback);status.textContent=t('sent');event.target.reset();$('#guestCountWrap').hidden=false;
  }catch{status.textContent=t('failed')}finally{button.disabled=false}
});

let ticking=false;function updateHero(){ticking=false;if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;const y=Math.min(scrollY,innerHeight);$('#heroMedia').style.transform=`translate3d(0,${y*.06}px,0) scale(1.03)`}addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(updateHero)}},{passive:true});
$('#dataRetry').addEventListener('click',load);
load();
