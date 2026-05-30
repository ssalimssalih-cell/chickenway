// ==================== POS.JS AVEC BADGE COMMANDES EN LIGNE ET FIDÉLITÉ (DEBUG) ====================
var posCart = [], posStep = 1, posCategoriesList = [], posProductsList = [], posSelectedCategory = 'all';
var posCurrentClient = null, posCurrentTable = '', posPaymentMethod = 'espece', posAmountGiven = 0, posDiscountMAD = 0;
var posAllClients = [], posFilteredClients = [], posCurrentProductId = null;
var posSaucesList = ['Ketchup','Sauce Hot','Cheezy','Sauce Burger','Algérienne','Barbecue','Mayonnaise','Harissa','Samouraï','Andalouse'];
var posInterditsList = ['Oignon','Tomate','Cornichon','Olive','Fromage','Salade'];
var posEpicesList = ['Normal','Moins épicé','Très épicé','Sans épice'];
var posSelList = ['Normal','Moins de sel','Sans sel'];

var posCommandesTables = [];
var posCommandesTablesCount = 0;
var posCommandesEnLigneCount = 0;

async function loadPosPage(c) { /* ... inchangé ... */ }
async function posChargerCommandesTables() { /* ... inchangé ... */ }
async function posChargerCommandesEnLigneCount() { /* ... inchangé ... */ }
function posResetCart() { /* ... inchangé ... */ }
function posSearchClient(query) { /* ... inchangé ... */ }
function renderClientDropdown() { /* ... inchangé ... */ }
function posSelectClientFromDropdown(cid,cn){ /* ... inchangé ... */ }
document.addEventListener('click',function(e){ /* ... inchangé ... */ });
function updatePaymentButtons(){ /* ... inchangé ... */ }
function posSetTable(v){ /* ... inchangé ... */ }
function posOpenOptionsModal(pid){ /* ... inchangé ... */ }
function posConfirmOptions(){ /* ... inchangé ... */ }
function renderPOS() { /* ... inchangé ... */ }
function posAfficherCommandesTables() { /* ... inchangé ... */ }
function posChargerCommandeTable(commandeId) { /* ... inchangé ... */ }
async function posPayerCommandeTable(commandeId) { /* ... inchangé ... */ }
function posFilterCategory(ca){posSelectedCategory=ca;renderPOS();}
function posUpdateDiscountMAD(v){posDiscountMAD=parseFloat(v)||0;if(posDiscountMAD<0)posDiscountMAD=0;renderPOS();}
function posUpdateQty(i,ch){var it=posCart[i];if(!it)return;var p=posProductsList.find(function(x){return x.id===it.id;});var nq=it.quantite+ch;if(nq<=0)posCart.splice(i,1);else{if(p&&p.stock!==undefined&&nq>p.stock){alert('Max: '+p.stock);return;}it.quantite=nq;}renderPOS();}
function posRemoveItem(i){posCart.splice(i,1);renderPOS();}
function posCalculateTotal(){var t=0;for(var i=0;i<posCart.length;i++)t+=posCart[i].prixUnitaire*posCart[i].quantite;return t;}
function posGoToStep2(){if(posCart.length===0){alert('Panier vide');return;}posStep=2;renderPOS();}
function posGoToStep1(){posStep=1;delete window.posCommandeId;delete window.posVenteId;renderPOS();}
function posSetPaymentMethod(m){if((m==='credit'||m==='partiel')&&(!posCurrentClient||!posCurrentClient.id)){alert('Client requis pour crédit/partiel.');return;}posPaymentMethod=m;posAmountGiven=0;renderPOS();}
function posCalculateChange(){var ai=document.getElementById('posAmountGiven'),cd=document.getElementById('posChangeDisplay');if(!ai||!cd)return;var st=posCalculateTotal();var t=st-posDiscountMAD;posAmountGiven=parseFloat(ai.value)||0;var c=posAmountGiven-t;if(posAmountGiven>0){cd.innerHTML=c>=0?'<div class="pos-change-positive"><span>Rendu</span><span>'+c.toFixed(2)+' MAD</span></div>':'<div class="pos-change-negative"><span>Manquant</span><span>'+Math.abs(c).toFixed(2)+' MAD</span></div>';}else{cd.innerHTML='';}}

// ==================== FINALISATION DE LA VENTE (AVEC FIDÉLITÉ DEBUG) ====================
async function posFinalizeSale() {
    var st=posCalculateTotal();var t=st-posDiscountMAD;
    if(!posCurrentClient&&!posCurrentTable){alert('Client ou table requis.');return;}
    if(posCurrentTable&&(posPaymentMethod==='credit'||posPaymentMethod==='partiel')){alert('Table = espèces uniquement.');return;}
    if((posPaymentMethod==='credit'||posPaymentMethod==='partiel')&&!posCurrentClient){alert('Client requis pour crédit/partiel.');return;}
    if(posPaymentMethod==='espece'){posAmountGiven=parseFloat(document.getElementById('posAmountGiven').value)||0;if(posAmountGiven<t){alert('Montant insuffisant.');return;}}
    var vendeur=document.getElementById('posVendeur').value.trim()||(window.currentUserData?window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom:'');
    try{
        var fcs=await db.collection('ventes').get();var fn='FACT-'+new Date().getFullYear()+'-'+String(fcs.size+1).padStart(5,'0');
        var remaining=0,paid=true,statutPaiement='payé',change=0;
        if(posPaymentMethod==='credit'){paid=false;remaining=t;statutPaiement='crédit';}
        else if(posPaymentMethod==='partiel'){posAmountGiven=parseFloat(document.getElementById('posAmountGiven').value)||0;remaining=t-posAmountGiven;paid=false;statutPaiement='partiel';change=Math.max(0,posAmountGiven-t);}
        else{posAmountGiven=parseFloat(document.getElementById('posAmountGiven').value)||0;change=posAmountGiven-t;paid=true;statutPaiement='payé';}
        if(posCurrentTable&&!posCurrentClient){paid=false;statutPaiement='en_attente';remaining=t;}
        var profitTotal=0;
        var itemsDetail=posCart.map(function(it){var pa=it.prixAchat||0,pvn=it.prixVente||0,pp=it.prixPromo||0,pvr=(pp>0)?pp:pvn;var prof=(pvr-pa)*it.quantite;profitTotal+=prof;return{id:it.id,nom:it.nom,quantite:it.quantite,prixVente:pvr,prixAchat:pa,prixPromo:pp,profit:prof,sauces:it.sauces||[],interdits:it.interdits||[],epice:it.epice||'Normal',sel:it.sel||'Normal'};});
        var sd={factureNum:fn,items:itemsDetail,subtotal:st,discountMAD:posDiscountMAD,total:t,clientId:posCurrentClient?posCurrentClient.id:null,clientName:posCurrentClient?posCurrentClient.name:null,table:posCurrentTable||null,vendeur:vendeur,paymentMethod:posPaymentMethod,statutPaiement:statutPaiement,amountGiven:posAmountGiven,change:change,paid:paid,remainingAmount:remaining,profitTotal:profitTotal,createdAt:firebase.firestore.FieldValue.serverTimestamp()};
        await CacheDB.write('ventes', null, sd, 'add');
        if(!paid) await CacheDB.write('credits', null, sd, 'add');
        if(window.posCommandeId){
            await CacheDB.write('commandes', window.posCommandeId, {statut:'payé',paidAt:firebase.firestore.FieldValue.serverTimestamp(),factureNum:fn}, 'update');
            delete window.posCommandeId;
        }
        if(window.posVenteId){
            await CacheDB.write('ventes', window.posVenteId, {paid:true,statutPaiement:'payé',remainingAmount:0,paidAt:firebase.firestore.FieldValue.serverTimestamp()}, 'update');
            var venteDoc = await db.collection('ventes').doc(window.posVenteId).get();
            if(venteDoc.exists){
                var creditSnap = await db.collection('credits').where('factureNum','==',venteDoc.data().factureNum).get();
                creditSnap.forEach(function(cd){ CacheDB.write('credits', cd.id, {paid:true,remainingAmount:0}, 'update'); });
            }
            delete window.posVenteId;
        }
        // Mise à jour des stocks
        for(var i=0;i<posCart.length;i++){var it=posCart[i];try{var pr=await db.collection('products').doc(it.id).get();if(pr.exists){var pd=pr.data();await CacheDB.write('products',it.id,{stock:Math.max(0,(pd.stock||0)-it.quantite),vendues:(pd.vendues||0)+it.quantite,ca:(pd.ca||0)+(it.prixUnitaire*it.quantite),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},'update');}}catch(e){}}
        // Mise à jour du CA/profit du client + points fidélité
        if(posCurrentClient&&posCurrentClient.id&&paid){
            try{
                var cr=await db.collection('clients').doc(posCurrentClient.id).get();
                if(cr.exists){
                    var cd=cr.data();
                    console.log('[Fidélité] Client trouvé :', cd);
                    var updateData = {
                        ca:(cd.ca||0)+t,
                        profit:(cd.profit||0)+profitTotal,
                        updatedAt:firebase.firestore.FieldValue.serverTimestamp()
                    };

                    // Récupération des paramètres de fidélité
                    var fideliteActive = false;
                    var pointsParVente = 1;
                    try {
                        const fDoc = await db.collection('settings').doc('fidelite').get();
                        console.log('[Fidélité] Document settings/fidelite :', fDoc.exists, fDoc.data());
                        if (fDoc.exists) {
                            fideliteActive = fDoc.data().active === true;
                            pointsParVente = fDoc.data().pointsParVente || 1;
                        }
                    } catch(e) {
                        console.warn('[Fidélité] Erreur Firestore, fallback localStorage', e);
                        fideliteActive = localStorage.getItem('fidelite_active') === 'true';
                        pointsParVente = parseInt(localStorage.getItem('fidelite_points')) || 1;
                    }

                    if (fideliteActive) {
                        var anciensPoints = cd.pointsFidelite || 0;
                        updateData.pointsFidelite = anciensPoints + pointsParVente;
                        console.log('[Fidélité] Active, +'+pointsParVente+' points. Ancien :', anciensPoints, 'Nouveau :', updateData.pointsFidelite);
                    } else {
                        console.log('[Fidélité] Programme inactif, points non ajoutés.');
                    }
                    await CacheDB.write('clients', posCurrentClient.id, updateData, 'update');
                } else {
                    console.warn('[Fidélité] Client introuvable dans Firestore, impossible d\'ajouter des points.');
                }
            }catch(e){
                console.error('[Fidélité] Erreur lors de la mise à jour du client :', e);
            }
        }

        var msg='✅ Vente: '+fn+'\n💰 Total: '+t.toFixed(2)+' MAD';
        if(posPaymentMethod==='espece'&&posAmountGiven>t)msg+='\n💵 Rendu: '+change.toFixed(2)+' MAD';
        if(statutPaiement==='crédit')msg+='\n📋 Crédit enregistré.';
        if(statutPaiement==='partiel')msg+='\n📋 Reste: '+remaining.toFixed(2)+' MAD';
        if(statutPaiement==='en_attente')msg+='\n⏳ En attente de paiement.';
        alert(msg);posResetCart();renderPOS();CacheDB.sync();
    }catch(e){alert('Erreur: '+e.message);}
}
console.log('POS JS avec fidélité debug');
