
const toggle=document.querySelector('.menu-toggle');
const links=document.querySelector('.nav-links');
if(toggle) toggle.addEventListener('click',()=>links.classList.toggle('open'));

document.querySelectorAll('.nav-links a').forEach(a=>{
  if(a.pathname===location.pathname || (a.getAttribute('href')==='index.html' && location.pathname.endsWith('/')))
    a.classList.add('active');
});

const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')});
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

const search=document.querySelector('[data-search]');
if(search){
  search.addEventListener('input',()=>{
    const term=search.value.toLowerCase();
    document.querySelectorAll('[data-search-item]').forEach(item=>{
      item.style.display=item.textContent.toLowerCase().includes(term)?'':'none';
    });
  });
}

const form=document.querySelector('#contactForm');
if(form){
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const msg=document.querySelector('#formMessage');
    msg.textContent='Thank you! Your message has been prepared. Connect this form to your preferred email/form service for live submissions.';
    msg.className='notice';
    form.reset();
  });
}
