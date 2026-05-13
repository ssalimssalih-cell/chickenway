var posCart=[],posStep=1,posCategoriesList=[],posProductsList=[],posSelectedCategory='all',posCurrentClient=null,posCurrentTable='',posPaymentMethod='espece',posAmountGiven=0,posDiscount=0,posAllClients=[],posCurrentProductId=null;
var posSaucesList=['Ketchup','Sauce Hot','Cheezy','Sauce Burger','Algérienne','Barbecue','Mayonnaise','Harissa','Samouraï','Andalouse'];
var posInterditsList=['Oignon','Tomate','Cornichon','Olive','Fromage','Salade'];
var posEpicesList=['Normal','Moins épicé','Très épicé','Sans épice'];
var posSelList=['Normal','Moins de sel','Sans sel'];

async function loadPosPage(c){posResetCart();posStep=1;try{var cs=await db.collection('categories').get();posCategoriesList=[];cs.forEach(function(d){posCategoriesList.push({id:d.id,nom:d.data().nom,imageBase64:d.data().imageBase64});});var ps=await db.collection('products').get();posProductsList=[];ps.forEach(function(d){var dd=d.data();if(dd.disponible!==false)posProductsList.push({id:d.id,nom:dd.nom,prixVente:dd.prixVente||0,prixPromo:dd.prixPromo||0,prixAchat:dd.prixAchat||0,stock:dd.stock,categorie:dd.categorie||'',imageBase64:dd.imageBase64||''});});var cl=await db.collection('clients').orderBy('nom').get();posAllClients=[];cl.forEach(function(d){posAllClients.push({id:d.id,nom:d.data().nom,prenom:d.data().prenom,telephone:d.data().telephone});});}catch(e){}renderPOS();}
function posResetCart(){posCart=[];posStep=1;posSelectedCategory='all';posCurrentClient=null;posCurrentTable='';posPaymentMethod='espece';posAmountGiven=0;posDiscount=0;}

function posOpenOptionsModal(pid){var p=posProductsList.find(function(x){return x.id===pid;});if(!p)return;if(p.stock!==undefined&&p.stock<=0){alert('Rupture');return;}posCurrentProductId=pid;
    var h='<h4>'+p.nom+'</h4>';
    h+='<div style="margin-bottom:15px;"><label style="font-weight:600;">🥫 Sauces:</label><div style="display:flex;flex-wrap:wrap;gap:6px;">';posSaucesList.forEach(function(s){h+='<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="checkbox" class="pos-sauce-check" value="'+s+'"> '+s+'</label>';});h+='</div></div>';
    h+='<div style="margin-bottom:15px;"><label style="font-weight:600;">🚫 Interdits:</label><div style="display:flex;flex-wrap:wrap;gap:6px;">';posInterditsList.forEach(function(s){h+='<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="checkbox" class="pos-interdit-check" value="'+s+'"> '+s+'</label>';});h+='</div></div>';
    h+='<div style="margin-bottom:15px;"><label style="font-weight:600;">🌶️ Épices:</label><div style="display:flex;flex-wrap:wrap;gap:6px;">';posEpicesList.forEach(function(s,idx){h+='<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="pos-epice" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>';});h+='</div></div>';
    h+='<div style="margin-bottom:15px;"><label style="font-weight:600;">🧂 Sel:</label><div style="display:flex;flex-wrap:wrap;gap:6px;">';posSelList.forEach(function(s,idx){h+='<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="pos-sel" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>';});h+='</div></div>';
    h+='<button class="btn-cancel" onclick="closeModal()" style="float:none;margin-right:10px;">Annuler</button><button class="btn-save" onclick="posConfirmOptions()" style="float:none;">Ajouter</button>';
    openModal('Personnaliser',h);}

function posConfirmOptions(){
    var sauces=[];document.querySelectorAll('.pos-sauce-check:checked').forEach(function(cb){sauces.push(cb.value);});
    var interdits=[];document.querySelectorAll('.pos-interdit-check:checked').forEach(function(cb){interdits.push(cb.value);});
    var epice=document.querySelector('input[name="pos-epice"]:checked');epice=epice?epice.value:'Normal';
    var sel=document.querySelector('input[name="pos-sel"]:checked');sel=sel?sel.value:'Normal';
    var p=posProductsList.find(function(x){return x.id===posCurrentProductId;});if(!p){closeModal();return;}
    var ex=posCart.find(function(x){return x.id===posCurrentProductId&&JSON.stringify(x.interdits)===JSON.stringify(interdits)&&x.epice===epice;});
    if(ex){if(p.stock!==undefined&&ex.quantite>=p.stock){alert('Stock insuffisant');closeModal();return;}ex.quantite+=1;}
    else{var pr=p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente;posCart.push({id:p.id,nom:p.nom,prixUnitaire:pr,prixAchat:p.prixAchat||0,quantite:1,categorie:p.categorie||'',imageBase64:p.imageBase64||'',sauces:sauces,interdits:interdits,epice:epice,sel:sel});}
    closeModal();renderPOS();}

function renderPOS(){var c=document.getElementById('dynamicContent');if(!c)return;var st=posCalculateTotal();var da=st*(posDiscount/100);var t=st-da;
    var h='<div class="pos-container"><div class="pos-products-panel"><div class="pos-categories-bar"><button class="pos-cat-btn '+(posSelectedCategory==='all'?'active':'')+'" onclick="posFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    for(var i=0;i<posCategoriesList.length;i++){var ca=posCategoriesList[i];var ac=posSelectedCategory===ca.nom?'active':'';var ih=ca.imageBase64?'<img src="'+ca.imageBase64+'" alt="">':'<i class="fas fa-folder"></i>';h+='<button class="pos-cat-btn '+ac+'" onclick="posFilterCategory(\''+ca.nom.replace(/'/g,"\\'")+'\')">'+ih+' '+ca.nom+'</button>';}
    h+='</div><div class="pos-products-grid">';var f=posProductsList;if(posSelectedCategory!=='all')f=posProductsList.filter(function(p){return p.categorie===posSelectedCategory;});
    if(f.length===0){h+='<div style="grid-column:1/-1;text-align:center;padding:40px;">Aucun</div>';}else{for(var j=0;j<f.length;j++){var p=f[j];var pr=p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente;var hp=p.prixPromo&&p.prixPromo>0;var sc='',stt='';if(p.stock!==undefined){if(p.stock<=0){sc='pos-out-of-stock';stt=' (Rupture)';}else if(p.stock<=5){stt=' ('+p.stock+' rest.)';}}h+='<div class="pos-product-card '+sc+'" onclick="posOpenOptionsModal(\''+p.id+'\')">';if(p.imageBase64)h+='<div class="pos-product-img"><img src="'+p.imageBase64+'" alt=""></div>';else h+='<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>';h+='<div class="pos-product-info"><span class="pos-product-name">'+p.nom+stt+'</span><span class="pos-product-price">';if(hp)h+='<span class="pos-old-price">'+p.prixVente.toFixed(2)+'</span> <span class="pos-promo-price">'+pr.toFixed(2)+' MAD</span>';else h+=pr.toFixed(2)+' MAD
