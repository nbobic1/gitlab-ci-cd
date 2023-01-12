var Kalendar = (function () {
 
  const mapaMjeseca = new Map([
    ['Januar', 2], ['Februar', 5], ['Mart', 6], ['April', 2],
    ['Maj', 4], ['Juni', 7], ['Juli', 2], ['August', 5],
    ['Septembar', 1], ['Oktobar', 3], ['Novembar', 6], ['Decembar', 1]
  ]);
  const nizMjeseci = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
  var redovnaZauzeca = [];
  var neperiodicnaZauzeca = [];
  var direction = 0, danZauzeca = -1, periodicniDan = -1;
  var trenutniMjesec, pocetak, kraj, opcija, osobljeOpcija;

  function provjeriZauzece (termin) {
     let poc = termin["pocetak"], kr = termin["kraj"] ,naziv = termin["opcija"] , dan = termin["odabraniDan"], mon = termin["trenutniMjesec"];
     console.log( poc + " " + kraj  + " " + naziv + " " + dan + " " + mon );
  }
  function daLiJeLjetni(trenutniMjesec) {
    for (let i = 1; i <= 5; i++)
      if (trenutniMjesec == nizMjeseci[i]) return true;
    return false;
  }


  function daLiJeZimski(trenutniMjesec) {
    for (let i = 9; i <= 11; i++)
      if (trenutniMjesec == nizMjeseci[i]) return true;
      if (trenutniMjesec == nizMjeseci[0]) return true;
    return false;
  }

  function ucitajPodatkeIzForme() {
    pocetak = document.getElementById("pocetak").value;
    kraj = document.getElementById("kraj").value;
    opcija = document.getElementById("saleSelect").value;
   
    trenutniMjesec = document.getElementById("month").textContent;
    obojiZauzecaImpl(document.getElementById("datumi"), nizMjeseci.indexOf(trenutniMjesec), opcija, pocetak, kraj);
  }

  function dajPredavaca () {
    return document.getElementById("osobljeSelect").value;
  }
 
  function dajMjesecIzObjekta(datum) {
    let arr = datum.split(".");
    return nizMjeseci[parseInt(arr[1]) - 1];
  }

  function dajDanIzObjekta(datum) {
    let arr = datum.split(".");
    return arr[0];
  }


  function preklapanjeVremena(poc, kr, pocetak, kraj) {
    if (pocetak >= kraj) return false;
    if ((poc >= pocetak && poc < kraj) || (kr > pocetak && kr <= kraj) || (poc <= pocetak && kr >= kraj))  return true;
     return false;
  }

  function resetujBoje(kalendarRef) {
    for (let i = 2, row; row = kalendarRef.rows[i], i < kalendarRef.rows.length; i++) {
      for (let j = 0, col; col = row.cells[j]; j++) {
        let sadrzajKolone = col.innerHTML;
        sadrzajKolone = sadrzajKolone.replace("zauzeta", "slobodna");
        col.innerHTML = sadrzajKolone;
      }
    }
  }

  function obojiZauzecaImpl(kalendarRef, mjesec, sala, pocetak, kraj) {
    this.pocetak = pocetak;
    this.kraj = kraj;
    resetujBoje(document.getElementById("datumi")); //resetovanje boja

    //obojenja za neperiodicna zauzeca
    for (let k = 0; k < neperiodicnaZauzeca.length; k++) {
          let objectMjesec = dajMjesecIzObjekta(neperiodicnaZauzeca[k].datum);
          danZauzeca = parseInt(dajDanIzObjekta(neperiodicnaZauzeca[k].datum));
         if (sala == neperiodicnaZauzeca[k].naziv) {
           if (mjesec == nizMjeseci.indexOf(objectMjesec) && preklapanjeVremena(neperiodicnaZauzeca[k].pocetak, neperiodicnaZauzeca[k].kraj, this.pocetak, this.kraj)) {
            let poz = mapaMjeseca.get(objectMjesec) + danZauzeca, counter = 1;

          for (let i = 2, row; row = kalendarRef.rows[i], i < kalendarRef.rows.length; i++) {
            for (let j = 0, col; col = row.cells[j]; j++ , counter++) {
                if (poz == counter) {
                col.innerHTML = "<td><table class=\"unutrasnja\" onclick='rezervirajTermin(" + danZauzeca +")'><tr><td>" + danZauzeca + "</td></tr><tr><td class=\"zauzeta\"></td></tr></table></td>";
              }
            }
          }
        }
      }
    }

    //obojenja za redovna zauzeca
    for (let k = 0; k < redovnaZauzeca.length; k++) {
        if (sala == redovnaZauzeca[k].naziv && ((redovnaZauzeca[k].semestar == "zimski" && daLiJeZimski(nizMjeseci[mjesec])) || (redovnaZauzeca[k].semestar == "ljetni" && daLiJeLjetni(nizMjeseci[mjesec])))) {
        periodicniDan = redovnaZauzeca[k].dan;
       if (preklapanjeVremena(redovnaZauzeca[k].pocetak, redovnaZauzeca[k].kraj, this.pocetak, this.kraj) && periodicniDan != -1) {
         for (let i = 2, row; row = kalendarRef.rows[i], i < kalendarRef.rows.length; i++) {
            for (let j = 0, col; col = row.cells[j]; j++) {
              if (col.textContent != "" && j == periodicniDan) {
           
              col.innerHTML = "<td><table class=\"unutrasnja\" onclick='rezervirajTermin(" + col.textContent +")'><tr><td>" + col.textContent + "</td></tr><tr><td class=\"zauzeta\"></td></tr></table></td>";
              }
            }
          }
        }
      }
    }

  }


  function ucitajPodatkeImpl(periodicna, redovna) {
   
    neperiodicnaZauzeca = []; redovnaZauzeca = []; 

    resetujBoje(document.getElementById("datumi"));
    for (let i = 0; i < periodicna.length; i++) {
      neperiodicnaZauzeca.push(periodicna[i]);
    }
    for (let i = 0; i < redovna.length; i++) {
      redovnaZauzeca.push(redovna[i]);
    }

  }

  function iscrtajKalendarImpl(kalendarRef, mjesec) {

    var numberOfRows = kalendarRef.rows.length;
    var pozicija = mjesec;
    if ((direction == 1 && pozicija == 11) || (pozicija == 0 && direction == -1)) return;
    var daniMjesec = daysInMonth(pozicija + direction + 1, 2020);
    var nazivMjeseca = nizMjeseci[pozicija + direction];
    document.getElementById("month").textContent = nazivMjeseca;
    let dayCounter = 1, targetRow = kalendarRef.rows[2];
    targetRow.innerHTML = "";
    //crtanje dana u prvom redu
    for (var j = 0; j < 7; j++) {
      if (j >= mapaMjeseca.get(nazivMjeseca)) {
        targetRow.innerHTML += "<td><table class=\"unutrasnja\" onclick='rezervirajTermin(" + dayCounter +")'><tr><td>" + dayCounter++ + "</td></tr><tr><td class=\"slobodna\"></td></tr></table></td>";
      }
      else {
        targetRow.innerHTML += "<td></td>";
      }

    }
   
    for (var i = 3, row; row = kalendarRef.rows[i], i < numberOfRows; i++) {
      for (var j = 0, col; col = row.cells[j]; j++ , dayCounter++) {
        if (dayCounter <= daniMjesec) {
          col.innerHTML = "<td><table class=\"unutrasnja\" onclick='rezervirajTermin(" + dayCounter +")'><tr><td>" + dayCounter + "</td></tr><tr><td class=\"slobodna\"></td></tr></table></td>";
        }
        else {
          col.innerHTML = "<td></td>";
        }
      }
    }
    
    //ukoliko svi dani nisu u kalendaru a kapacitet je popunjen (dodajem novi red)
    if (dayCounter <= daniMjesec) {
      newRow = kalendarRef.insertRow(numberOfRows);
      newRow.innerHTML = "<tr class=\"red\"> <td></td><td></td><td></td> <td></td> <td></td><td></td><td></td></tr>";
      for (var j = 0, col; col = newRow.cells[j]; j++ , dayCounter++) {
        if (dayCounter <= daniMjesec) {
          col.innerHTML = "<td><table class=\"unutrasnja\" onclick='rezervirajTermin(" + dayCounter +")'><tr><td>" + dayCounter + "</td></tr><tr><td class=\"slobodna\"></td></tr></table></td>";
        }
        else {
          col.innerHTML = "<td></td>";
        }
      }
    }
    direction = 0;
    ucitajPodatkeIzForme();
  }

  function callPrev() {
    direction = -1;
    var nazivMjeseca = document.getElementById("month").textContent;
    iscrtajKalendarImpl(document.getElementById("datumi"), nizMjeseci.indexOf(nazivMjeseca));
  }
  function callNext() {
    direction = 1;
    var nazivMjeseca = document.getElementById("month").textContent;
    iscrtajKalendarImpl(document.getElementById("datumi"), nizMjeseci.indexOf(nazivMjeseca));
  }

  function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  function formirajDatum (day, mon) {
     let monVal = nizMjeseci.indexOf(mon) +1 ;
     return ((day>= 10) ? "" : "0") + day + "/" + ((monVal>=10) ? "": "0") + monVal + "/2020";
  }
  
  function provjeraZauzeca (odabraniDan) {
    let txt =document.getElementsByClassName('unutrasnja')[odabraniDan-1].innerHTML;
    return txt.includes("zauzeta");
  }
 return {
    obojiZauzeca: obojiZauzecaImpl,
    ucitajPodatke: ucitajPodatkeImpl,
    iscrtajKalendar: iscrtajKalendarImpl,
    callPrev: callPrev,
    callNext: callNext,
    ucitajPodatkeIzForme: ucitajPodatkeIzForme,
    provjeraZauzeca,
    formirajDatum
  
  }
}());

