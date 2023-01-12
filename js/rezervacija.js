var pocetak, kraj, opcija, trenutniMjesec , periodicnost, dan, imeOsobe;
var listaOsoblja = [];
window.onload = (event) => {
    var d = new Date();
    Kalendar.iscrtajKalendar(document.getElementById("datumi"), d.getMonth());
     Pozivi.dobaviPodatkeZaSelect();
};

// #region Spirala 4
function ucitajSelectOsoblja (osoblje) {
    listaOsoblja=[];
    let select= document.getElementById('osobljeSelect');
    osoblje.forEach(function(item){
        let option = document.createElement('option');
        option.value= item.ime + " " + item.prezime;
        option.appendChild(document.createTextNode(option.value));
        select.appendChild(option);
        listaOsoblja.push({naziv: option.value, uloga: item.uloga});
      });
    Pozivi.dobaviSale();
}

function ucitajSelectSala (osoblje) {
    let select= document.getElementById('saleSelect');
    osoblje.forEach(function(item){
        let option = document.createElement('option');
        option.value= item.naziv;
        option.appendChild(document.createTextNode(option.value));
        select.appendChild(option);
      });
      Pozivi.ucitajIzBaze(true);
}

function dajUlogu (imeOsobe) {
  let uloga = "unknown";
 listaOsoblja.forEach (function(item) {
    if (item.naziv==imeOsobe) {
           console.log(item.uloga);
           uloga= item.uloga;
       }
   });
   return uloga;
}
// #endregion


// #region Spirala 3

function validirajFormu () {
  return pocetak!="" && kraj!="" && pocetak<=kraj;
}

function ucitajFormu () {
   pocetak = document.getElementById("pocetak").value;
   kraj = document.getElementById("kraj").value;
   opcija = document.getElementById("saleSelect").value;
   trenutniMjesec = document.getElementById("month").textContent;
   periodicnost = document.getElementById("periodicnost").checked;
   imeOsobe = document.getElementById("osobljeSelect").value;
   return validirajFormu();
}

function rezervirajTermin (odabraniDan) {
   
    if (!ucitajFormu()) { 
        alert("Error: Incorrect data in form.");
        return ;
    }
    dan= odabraniDan;
    let potvrda = confirm("Do you want to reserve classroom?");
    let chc =Kalendar.provjeraZauzeca(odabraniDan);
    
    if (chc)  {
     let dat = Kalendar.formirajDatum(odabraniDan, trenutniMjesec);
     
     alert("It's not possible to reserve classroom " + opcija + " for selected date " + dat + " and period from " + pocetak + " to " + kraj + "!\n" + "You clicked reserved date.");
      Pozivi.ucitajIzBaze(true); 
     return ;
   }
    if (potvrda) {
        Pozivi.ucitajIzBaze(false);
    }
  
}

function slanjeTermina () {
    Pozivi.posaljiTermin ({pocetak:pocetak , kraj:kraj, opcija:opcija, trenutniMjesec:trenutniMjesec, odabraniDan:dan, periodicnost:periodicnost, predavac:imeOsobe , uloga:dajUlogu(imeOsobe)});
}
//#endregion