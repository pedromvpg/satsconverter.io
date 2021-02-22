$( document ).ready(function() {

  var btcusd = 56249;
  var btceur = 46249;
  var btcyuan = 178249;
  var input_sats, input_btc, input_usd, input_eur, input_yuan,
      output_sats, output_btc, output_usd, output_eur, output_yuan;







  $("#input_sats").keyup(function() {
      calc('sats');
  });

  $("#input_btc").keyup(function() {
      calc('btc');
  });


  $("#input_sats").change(function() {
      calc('sats');
  });

  $("#input_btc").change(function() {
      calc('btc');
  });

  calc();




  function calc(source){

    console.log(source);
    console.log(' > '+$("#input_sats").val());

    input_sats = parseFloat(removeCommas($("#input_sats").val()));
    input_btc = removeCommas($("#input_btc").val());
    input_usd = removeCommas($("#input_usd").val());
    input_eur = removeCommas($("#input_eur").val());
    input_yuan = removeCommas($("#input_yuan").val());

    console.log(' >>> '+input_sats);

    if (source === undefined){

      console.log('undefined * ' + removeCommas(input_sats));

      $("#input_sats").focus();

      output_sats = 1000;
      output_btc = output_sats/100000000;
      output_usd = output_btc/btcusd;
      output_eur = output_btc*btceur;
      output_yuan = output_btc*btcyuan;


    } else if (source == 'sats'){

      console.log('sats');

      output_sats = input_sats;
      output_btc = output_sats/100000000;
      output_usd = btcusd*output_btc;
      output_eur = output_btc*btceur;
      output_yuan = output_btc*btcyuan;


    } else if (source == 'btc'){
      output_sats = output_btc*100000000;
      output_btc = input_btc;
      output_usd = btcusd*output_btc;
      output_eur = output_btc*btceur;
      output_yuan = output_btc*btcyuan;
    }




      $("#input_sats").val(output_sats.toLocaleString()).text(output_sats.toLocaleString());
      $("#input_btc").val(addCommas(output_btc)).text(addCommas(output_btc));
      $("#input_usd").val(addCommas(output_usd)).text(addCommas(output_usd));
      $("#input_eur").val(addCommas(output_eur)).text(addCommas(output_eur));
      $("#input_yuan").val(addCommas(output_yuan)).text(addCommas(output_yuan));


  }


  function addCommas(x) {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
  }

  function removeCommas(x) {
      return x.replace(',', '');
  }



});
