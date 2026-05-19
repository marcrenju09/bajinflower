/* ─── DATA ─── */
const ADMIN_PW = 'admin123'; // Change your password here

const DEFAULTS = [
  {id:1,name:'Red Romance Bouquet',   desc:'A dozen premium red roses — the ultimate expression of love and passion.',price:850,badge:'Bestseller',img:'',emoji:'🌹',bg:'linear-gradient(140deg,#f9e4e8,#f5cfd6)'},
  {id:2,name:'Pink Bliss Arrangement',desc:'Soft pink carnations and tulips for a gentle, heartfelt gift.',          price:650,badge:'',          img:'',emoji:'🌸',bg:'linear-gradient(140deg,#fff0f8,#ffd6eb)'},
  {id:3,name:'Sunshine Sunflowers',   desc:'Bright, cheerful sunflowers to bring warmth and joy to any room.',       price:580,badge:'New',        img:'',emoji:'🌻',bg:'linear-gradient(140deg,#fff9e0,#ffe9a0)'},
  {id:4,name:'Garden Mix Bouquet',    desc:"A lush seasonal mix — lilies, chrysanthemums, and baby's breath.",       price:720,badge:'',          img:'',emoji:'💐',bg:'linear-gradient(140deg,#e8f5e9,#c8e6c9)'},
  {id:5,name:'Lavender Dreams',       desc:'Elegant lavender and white calla lilies — calm, pure, and sophisticated.',price:780,badge:'',         img:'',emoji:'🪻',bg:'linear-gradient(140deg,#ede7f6,#d1c4e9)'},
  {id:6,name:'Peach & Cream Delight', desc:'Warm peach roses with white freesia — perfect for anniversaries.',       price:690,badge:'Sale',       img:'',emoji:'🌷',bg:'linear-gradient(140deg,#fff3e0,#ffe0b2)'},
];
const EMOJIS = ['🌹','🌸','🌻','💐','🪻','🌷','🌺','🌼','🏵️','🎀'];
const BGS    = ['linear-gradient(140deg,#f9e4e8,#f5cfd6)','linear-gradient(140deg,#fff0f8,#ffd6eb)','linear-gradient(140deg,#fff9e0,#ffe9a0)','linear-gradient(140deg,#e8f5e9,#c8e6c9)','linear-gradient(140deg,#ede7f6,#d1c4e9)','linear-gradient(140deg,#fff3e0,#ffe0b2)'];

let products = JSON.parse(localStorage.getItem('bp_products')||'null') || DEFAULTS;
let nextId   = Math.max(...products.map(p=>p.id), 0) + 1;
let editingId = null;
let orders = JSON.parse(localStorage.getItem('bp_orders')||'null') || [];
let orderNextId = Math.max(0, ...orders.map(o=>o.id)) + 1;
let paymentSettings = JSON.parse(localStorage.getItem('bp_payment_settings')||'null') || {
  gcashNo:'', gcashQr:'', paymayaNo:'', paymayaQr:'', bankName:'', bankAccount:'', bankNameOwner:'', bankQr:'', defaultMethod:'gcash'
};

function saveData(){ localStorage.setItem('bp_products', JSON.stringify(products)); }
function saveOrders(){ localStorage.setItem('bp_orders', JSON.stringify(orders)); }
function persistPaymentSettings(){ localStorage.setItem('bp_payment_settings', JSON.stringify(paymentSettings)); }

/* ─── RENDER SHOP ─── */
function renderShop(){
  const grid = document.getElementById('shopGrid');
  const sel  = document.getElementById('item');
  grid.innerHTML = '';
  sel.innerHTML  = '<option value="">— Select an item —</option>';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML =
      '<div class="product-img">'
      + (p.img
        ? `<img src="${p.img}" alt="${escH(p.name)}">`
        : `<div class="product-img-placeholder" style="background:${p.bg||BGS[0]};">${p.emoji||'💐'}<small>No photo yet</small></div>`)
      + (p.badge ? `<span class="badge-new">${escH(p.badge)}</span>` : '')
      + '</div>'
      + '<div class="product-info">'
      + `<h3>${escH(p.name)}</h3>`
      + `<p class="desc">${escH(p.desc)}</p>`
      + '<div class="product-footer">'
      + `<span class="price">₱${p.price.toLocaleString()}</span>`
      + `<button class="add-btn" onclick="selectProduct(${p.id})">Order This</button>`
      + '</div></div>';
    grid.appendChild(card);
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = `${p.name} — ₱${p.price.toLocaleString()}`;
    sel.appendChild(opt);
  });
}
function escH(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ─── ORDER FORM ─── */
function selectProduct(id){
  document.getElementById('item').value = id;
  updateSummary();
  document.getElementById('order').scrollIntoView({behavior:'smooth'});
}
function selectPay(type){
  document.getElementById('opt-cod').classList.toggle('selected',type==='cod');
  document.getElementById('opt-online').classList.toggle('selected',type==='online');
  const onlineRow = document.getElementById('onlineMethodRow');
  const guideBox = document.getElementById('onlinePaymentGuide');
  if(type==='online'){
    onlineRow.style.display='block';
    guideBox.style.display='block';
    if(!document.getElementById('onlineMethod').value) document.getElementById('onlineMethod').value = paymentSettings.defaultMethod || 'gcash';
    renderOnlinePaymentGuide();
  } else {
    onlineRow.style.display='none';
    guideBox.style.display='none';
  }
}
function renderOnlinePaymentGuide(){
  const method = document.getElementById('onlineMethod').value;
  const info = document.getElementById('guideDetails');
  const title = document.getElementById('guideTitle');
  const desc = document.getElementById('guideDesc');
  const qrArea = document.getElementById('guideQrArea');
  const qrImage = document.getElementById('guideQrImage');
  const methodLabel = method === 'gcash' ? 'GCash' : method === 'paymaya' ? 'PayMaya' : 'Bank Transfer';
  title.textContent = `${methodLabel} Payment Details`;
  desc.textContent = 'Scan the QR code or use the number/details below to complete your payment.';
  let detailsHtml = '';
  let qrSrc = '';
  if(method === 'gcash'){
    detailsHtml = `<div><strong>Number</strong><span>${escH(paymentSettings.gcashNo || 'Not configured')}</span></div>`;
    qrSrc = paymentSettings.gcashQr || '';
  } else if(method === 'paymaya'){
    detailsHtml = `<div><strong>Number</strong><span>${escH(paymentSettings.paymayaNo || 'Not configured')}</span></div>`;
    qrSrc = paymentSettings.paymayaQr || '';
  } else {
    detailsHtml = `<div><strong>Bank</strong><span>${escH(paymentSettings.bankName || 'Not configured')}</span></div>`;
    detailsHtml += `<div><strong>Account</strong><span>${escH(paymentSettings.bankAccount || 'Not configured')}</span></div>`;
    detailsHtml += `<div><strong>Account Name</strong><span>${escH(paymentSettings.bankNameOwner || 'Not configured')}</span></div>`;
    qrSrc = paymentSettings.bankQr || '';
  }
  info.innerHTML = detailsHtml;
  if(qrSrc){
    qrImage.src = qrSrc;
    qrImage.style.display = 'block';
    qrArea.style.display = 'flex';
  } else {
    qrImage.src = '';
    qrImage.style.display = 'none';
    qrArea.style.display = 'none';
  }
}
function savePaymentSettings(){
  paymentSettings.gcashNo = document.getElementById('pay-gcash-no').value.trim();
  paymentSettings.gcashQr = document.getElementById('payGcashQrPreview').src || '';
  paymentSettings.paymayaNo = document.getElementById('pay-paymaya-no').value.trim();
  paymentSettings.paymayaQr = document.getElementById('payPaymayaQrPreview').src || '';
  paymentSettings.bankName = document.getElementById('pay-bank-name').value.trim();
  paymentSettings.bankAccount = document.getElementById('pay-bank-account').value.trim();
  paymentSettings.bankNameOwner = document.getElementById('pay-bank-nameowner').value.trim();
  paymentSettings.bankQr = document.getElementById('payBankQrPreview').src || '';
  paymentSettings.defaultMethod = document.getElementById('onlineMethod')?.value || paymentSettings.defaultMethod || 'gcash';
  persistPaymentSettings();
  renderOnlinePaymentGuide();
  showMsg(document.getElementById('payMsg'),'✅ Payment settings saved.');
}
function renderPaymentSettings(){
  document.getElementById('pay-gcash-no').value = paymentSettings.gcashNo || '';
  document.getElementById('pay-paymaya-no').value = paymentSettings.paymayaNo || '';
  document.getElementById('pay-bank-name').value = paymentSettings.bankName || '';
  document.getElementById('pay-bank-account').value = paymentSettings.bankAccount || '';
  document.getElementById('pay-bank-nameowner').value = paymentSettings.bankNameOwner || '';
  const previewMap = [
    ['payGcashQrPreview', paymentSettings.gcashQr, 'payGcashQrIcon', 'payGcashQrTxt'],
    ['payPaymayaQrPreview', paymentSettings.paymayaQr, 'payPaymayaQrIcon', 'payPaymayaQrTxt'],
    ['payBankQrPreview', paymentSettings.bankQr, 'payBankQrIcon', 'payBankQrTxt']
  ];
  previewMap.forEach(([imgId, src, iconId, textId])=>{
    const img = document.getElementById(imgId);
    if(src){ img.src = src; img.style.display='block'; document.getElementById(iconId).style.display='none'; document.getElementById(textId).style.display='none'; }
    else { img.src = ''; img.style.display='none'; document.getElementById(iconId).style.display=''; document.getElementById(textId).style.display=''; }
  });
  const onlineMethod = document.getElementById('onlineMethod');
  if(onlineMethod){ onlineMethod.value = paymentSettings.defaultMethod || 'gcash'; }
}
function showMsg(el,txt){el.textContent=txt;el.style.display='block';setTimeout(()=>{el.style.display='none';},3500);}
function updateSummary(){
  const val = document.getElementById('item').value;
  const qty = parseInt(document.getElementById('qty').value)||1;
  const box = document.getElementById('summaryBox');
  if(!val){box.style.display='none';return;}
  const p = products.find(x=>x.id==val);
  if(!p)return;
  document.getElementById('sumItem').textContent  = p.name;
  document.getElementById('sumPrice').textContent = '₱'+p.price.toLocaleString();
  document.getElementById('sumQty').textContent   = qty;
  document.getElementById('sumTotal').textContent = '₱'+(p.price*qty).toLocaleString();
  box.style.display='block';
}
function submitOrder(e){
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const contact = document.getElementById('contact').value.trim();
  const address = document.getElementById('address').value.trim();
  const itemId = parseInt(document.getElementById('item').value);
  const qty = parseInt(document.getElementById('qty').value)||1;
  const notes = document.getElementById('notes').value.trim();
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'cod';
  const paymentMethod = payment === 'online' ? document.getElementById('onlineMethod').value : 'cod';
  const product = products.find(x=>x.id===itemId);
  if(!product){ alert('Please choose a product.'); return; }
  if(payment === 'online' && !paymentMethod){ alert('Please choose an online payment option.'); return; }
  const order = {
    id: orderNextId++,
    customer: name,
    contact,
    address,
    itemId,
    itemName: product.name,
    qty,
    note: notes,
    payment,
    paymentMethod,
    total: product.price * qty,
    status: 'Pending',
    placedAt: new Date().toISOString(),
  };
  orders.push(order);
  saveOrders();
  document.getElementById('successName').textContent    = name;
  document.getElementById('successContact').textContent = contact;
  document.getElementById('successOrderId').textContent = order.id;
  document.getElementById('successOverlay').classList.add('show');
  document.getElementById('orderForm').reset();
  document.getElementById('summaryBox').style.display='none';
  document.getElementById('onlineMethodRow').style.display='none';
  document.getElementById('onlinePaymentGuide').style.display='none';
  document.getElementById('opt-cod').classList.remove('selected');
  document.getElementById('opt-online').classList.remove('selected');
  renderOrderList();
}
function closeSuccess(){
  document.getElementById('successOverlay').classList.remove('show');
  document.getElementById('shop').scrollIntoView({behavior:'smooth'});
}

/* ─── ADMIN PANEL ─── */
function openAdmin(){
  document.getElementById('adminPanel').classList.add('open');
  document.getElementById('adminBackdrop').classList.add('show');
  document.body.style.overflow='hidden';
}
function closeAdmin(){
  document.getElementById('adminPanel').classList.remove('open');
  document.getElementById('adminBackdrop').classList.remove('show');
  document.body.style.overflow='';
}
function doLogin(){
  const pw = document.getElementById('pwInput').value;
  if(pw===ADMIN_PW){
    document.getElementById('adminLogin').style.display='none';
    const m = document.getElementById('adminMain');
    m.style.display='flex';
    document.getElementById('pwInput').value='';
    document.getElementById('loginErr').style.display='none';
    renderProdList();
    renderOrderList();
  } else {
    document.getElementById('loginErr').style.display='block';
    document.getElementById('pwInput').value='';
  }
}
function switchTab(tab){
  document.getElementById('tabBtnAdd').classList.toggle('active',tab==='add');
  document.getElementById('tabBtnManage').classList.toggle('active',tab==='manage');
  document.getElementById('tabBtnOrders').classList.toggle('active',tab==='orders');
  document.getElementById('tabBtnPayments').classList.toggle('active',tab==='payments');
  document.getElementById('tabAdd').style.display    = tab==='add'    ? 'block':'none';
  document.getElementById('tabManage').style.display = tab==='manage' ? 'block':'none';
  document.getElementById('tabOrders').style.display = tab==='orders' ? 'block':'none';
  document.getElementById('tabPayments').style.display = tab==='payments' ? 'block':'none';
  if(tab==='manage') renderProdList();
  if(tab==='orders') renderOrderList();
  if(tab==='payments') renderPaymentSettings();
}

/* Badge chips */
function initChips(groupId, onChange){
  document.querySelectorAll('#'+groupId+' .badge-chip').forEach(chip=>{
    chip.onclick = ()=>{
      document.querySelectorAll('#'+groupId+' .badge-chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      if(onChange) onChange(chip.dataset.val);
    };
  });
}
let selectedBadge = '';
let editBadge = '';
initChips('badgeSelect',  v=>{ selectedBadge=v; });
initChips('editBadgeSelect', v=>{ editBadge=v; });

/* Image preview helper */
function previewImg(inputId, previewId, iconId, txtId){
  const input = document.getElementById(inputId);
  if(!input.files[0])return;
  const r = new FileReader();
  r.onload = e=>{
    const prev = document.getElementById(previewId);
    prev.src = e.target.result; prev.style.display='block';
    document.getElementById(iconId).style.display='none';
    document.getElementById(txtId).style.display='none';
  };
  r.readAsDataURL(input.files[0]);
}

/* Add product */
function addProduct(){
  const name  = document.getElementById('ap-name').value.trim();
  const desc  = document.getElementById('ap-desc').value.trim();
  const price = parseInt(document.getElementById('ap-price').value);
  const msg   = document.getElementById('addMsg');
  if(!name){showMsg(msg,'⚠️ Please enter a product name.');return;}
  if(!price||price<1){showMsg(msg,'⚠️ Please enter a valid price.');return;}
  const prev = document.getElementById('imgPreview');
  const img  = prev.src && prev.style.display!=='none' ? prev.src : '';
  const idx  = nextId % EMOJIS.length;
  const prod = {id:nextId++,name,desc:desc||'A beautiful floral arrangement.',price,badge:selectedBadge,img,emoji:EMOJIS[idx],bg:BGS[idx%BGS.length]};
  products.push(prod); saveData(); renderShop();
  ['ap-name','ap-desc','ap-price','ap-img'].forEach(id=>{ document.getElementById(id).value=''; });
  const p2=document.getElementById('imgPreview'); p2.src=''; p2.style.display='none';
  document.getElementById('uploadZoneIcon').style.display='';
  document.getElementById('uploadZoneTxt').style.display='';
  document.querySelectorAll('#badgeSelect .badge-chip').forEach(c=>c.classList.remove('active'));
  document.querySelector('#badgeSelect .badge-chip[data-val=""]').classList.add('active');
  selectedBadge='';
  showMsg(msg,`✅ "${prod.name}" added to your shop!`);
}
function showMsg(el,txt){el.textContent=txt;el.style.display='block';setTimeout(()=>{el.style.display='none';},3500);}

/* Manage list */
function renderProdList(){
  const list = document.getElementById('prodList');
  if(!products.length){
    list.innerHTML='<div class="empty-list"><div class="empty-icon">🌱</div><p>No products yet.<br>Add your first bouquet!</p></div>';
    return;
  }
  list.innerHTML=products.map(p=>`
    <div class="prod-list-item">
      <div class="prod-list-thumb">
        ${p.img?`<img src="${p.img}" alt="${escH(p.name)}">`:p.emoji||'💐'}
      </div>
      <div class="prod-list-info">
        <div class="prod-list-name">${escH(p.name)}</div>
        <div class="prod-list-price">₱${p.price.toLocaleString()}${p.badge?' · '+escH(p.badge):''}</div>
      </div>
      <div class="prod-list-actions">
        <button class="btn-edit" onclick="openEdit(${p.id})">✏️ Edit</button>
        <button class="btn-del"  onclick="deleteProduct(${p.id})">🗑 Del</button>
      </div>
    </div>`).join('');
}

function renderOrderList(){
  const list = document.getElementById('orderList');
  if(!list) return;
  if(!orders.length){
    list.innerHTML='<div class="empty-list"><div class="empty-icon">📭</div><p>No orders yet.<br>Your customers will see their orders here once placed.</p></div>';
    refreshOrdersTabCount();
    return;
  }
  refreshOrdersTabCount();
  list.innerHTML=orders.map(o=>`
    <div class="order-item">
      <div class="order-head">
        <div>
          <div class="order-title">Order #${o.id} — ${escH(o.itemName)}</div>
          <div class="order-meta">Placed by ${escH(o.customer)} • ${o.qty} pcs • ₱${o.total.toLocaleString()}</div>
        </div>
        <div class="order-status">
          <span class="status-pill ${o.status==='Delivered' ? 'delivered' : 'pending'}">${escH(o.status)}</span>
          <button class="btn-status" onclick="toggleOrderStatus(${o.id})">${o.status==='Delivered' ? 'Mark Pending' : 'Mark Delivered'}</button>
        </div>
      </div>
      <div class="order-details">
        <div class="order-detail"><strong>Customer</strong><span>${escH(o.customer)}</span></div>
        <div class="order-detail"><strong>Contact</strong><span>${escH(o.contact)}</span></div>
        <div class="order-detail"><strong>Address</strong><span>${escH(o.address)}</span></div>
        <div class="order-detail"><strong>Payment</strong><span>${escH(o.payment==='online' ? `Online (${o.paymentMethod ? (o.paymentMethod==='gcash' ? 'GCash' : o.paymentMethod==='paymaya' ? 'PayMaya' : 'Bank Transfer') : 'Online'})` : 'Cash on Delivery')}</span></div>
        <div class="order-detail"><strong>Notes</strong><span>${escH(o.note||'None')}</span></div>
      </div>
    </div>`).join('');
}

function refreshOrdersTabCount(){
  const tab = document.getElementById('tabBtnOrders');
  if(tab) tab.textContent = `📦 Orders (${orders.length})`;
}

function toggleOrderStatus(id){
  const idx = orders.findIndex(o=>o.id===id);
  if(idx < 0) return;
  orders[idx].status = orders[idx].status === 'Delivered' ? 'Pending' : 'Delivered';
  saveOrders();
  renderOrderList();
}

/* Delete */
function deleteProduct(id){
  if(!confirm('Remove this product from your shop?'))return;
  products=products.filter(p=>p.id!==id);
  saveData(); renderShop(); renderProdList();
}

/* Edit */
function openEdit(id){
  const p=products.find(x=>x.id===id);
  if(!p)return;
  editingId=id; editBadge=p.badge||'';
  document.getElementById('edit-name').value  = p.name;
  document.getElementById('edit-desc').value  = p.desc;
  document.getElementById('edit-price').value = p.price;
  document.querySelectorAll('#editBadgeSelect .badge-chip').forEach(c=>{
    c.classList.toggle('active', c.dataset.val===editBadge);
  });
  const prev=document.getElementById('editImgPreview');
  document.getElementById('edit-img').value='';
  if(p.img){prev.src=p.img;prev.style.display='block';document.getElementById('editUploadIcon').style.display='none';document.getElementById('editUploadTxt').style.display='none';}
  else{prev.src='';prev.style.display='none';document.getElementById('editUploadIcon').style.display='';document.getElementById('editUploadTxt').style.display='';}
  document.getElementById('editOverlay').classList.add('show');
}
function closeEdit(){
  document.getElementById('editOverlay').classList.remove('show');
  editingId=null;
}
function saveEdit(){
  if(!editingId)return;
  const idx=products.findIndex(x=>x.id===editingId);
  if(idx<0)return;
  const name=document.getElementById('edit-name').value.trim();
  const price=parseInt(document.getElementById('edit-price').value);
  if(!name||!price){alert('Name and price are required.');return;}
  const prev=document.getElementById('editImgPreview');
  const newImg = prev.src&&prev.style.display!=='none' ? prev.src : products[idx].img;
  products[idx]={...products[idx],name,desc:document.getElementById('edit-desc').value.trim(),price,badge:editBadge,img:newImg};
  saveData(); renderShop(); renderProdList(); closeEdit();
}

/* Smooth scroll */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const t=document.querySelector(a.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}
  });
});

/* Init */
renderShop();
