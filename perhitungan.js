$(document).ready(function() {
  var nilai_terbaik;
  var kriteria = [];
  var raw_nilai = [];
  var normalisasi = [];
  var pre_hasil = [];
  var hasilperhitungan = [];
  var datahasil = [];

  $(".search").keyup(function () {
    var searchTerm = $(".search").val();
    var listItem = $('.results tbody').children('tr');
    var searchSplit = searchTerm.replace(/ /g, "'):containsi('")

    $.extend($.expr[':'], {'containsi': function(elem, i, match, array){
        return (elem.textContent || elem.innerText || '').toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
      }
    });

    $(".results tbody tr").not(":containsi('" + searchSplit + "')").each(function(e){
      $(this).attr('visible','false');
    });

    $(".results tbody tr:containsi('" + searchSplit + "')").each(function(e){
      $(this).attr('visible','true');
    });

    var jobCount = $('.results tbody tr[visible="true"]').length;
    //$('.counter').text(jobCount + ' item');

    if(jobCount == '0') {
      $('.no-result').show();
    }else {
      $('.no-result').hide();
    }
  });

  //fungsi mengecek isi array
  function cekumkm(array2d, itemtofind) {
    return [].concat.apply([], ([].concat.apply([], array2d))).indexOf(itemtofind) !== -1;
  }

  function simpanhasil(){
    $.ajax({
      url: './inc/pages/perhitungan.php?p=saveHasil',
      type: 'POST',
      data: {
        simpandata : JSON.stringify(datahasil)
      },
      dataType: "JSON",
      success: function(respon) {

      },
      error: function(xhr, status, error) {
        alert(xhr.responseText + status + error);
      }
    }).done(function(data) {
      getDataHasil();
    })
  }

  function getDataHasil() {
    let counttabelhasil = $('#tablehasil tr').length;
    if (counttabelhasil > 0) {
      for (let k = 0; k < counttabelhasil; k++) {
        $('#baristabelhasil' + k + '').remove(); //hapus semua baris dinamis sebelum menampilkan modal
      }
    }
    $.ajax({
      type: 'GET',
      url: './inc/pages/perhitungan.php?p=selectHasil',
      dataType: "JSON",
      success: function(respon) {
        if (respon.length > 0) {
          let nomor = 1;
          for (let l = 0; l < respon.length; l++) {
            //membuat baris dinamis
            $('#tablehasil').append('<tr id="baristabelhasil' + l + '">'
            +'<td>' + nomor + '</td>'
            +'<td>' + respon[l].nama_umkm + '</td>' //nomor index nama umkm
            +'<td>' + respon[l].alamat_umkm + '</td>' //nomor index alamat umkm
            +'<td>' + respon[l].nama_pemilik + '</td>' //nomor index nama pemilik umkm
            +'<td class="text-primary">' + respon[l].nilai_hasil + '</td>'
            +'</tr>');
            nomor++;
          }
        }
      },
      error: function(xhr, status, error) {
        alert(xhr.responseText);
      }
    })
  }

  let start = performance.now();//measure time excute
  let start1 = new Date().getTime();

  //mengambil bobot, nilai maks/min kriteria.
  $.ajax({
    type: 'GET',
    url: './inc/pages/crudPengaturan.php?p=selectKriteria',
    dataType: "JSON",
    success: function(datakriteria) {
      if (datakriteria.length > 0) {
        for (var i = 0; i < datakriteria.length; i++) {
          var sifatkrit = datakriteria[i].sifat_kriteria;
          $.ajax({
            type: 'POST',
            url: './inc/pages/perhitungan.php?p=selectNilai',
            dataType: "JSON",
            async:false,
            data: 'id=' + datakriteria[i].id_kriteria,
            success: function(datanilai) {
              if (datanilai.length > 0) {
                nilai_terbaik = datanilai[0].nilai;
                for (var z = 0; z < datanilai.length; z++) {
                  if (sifatkrit == 'max') {
                    if (nilai_terbaik < datanilai[z].nilai) {
                      nilai_terbaik = datanilai[z].nilai;
                    }
                  } else {
                    if (nilai_terbaik > datanilai[z].nilai) {
                      nilai_terbaik = datanilai[z].nilai;
                    }
                  }

                  //input seluruh nilai ke dalam array multidimensi
                  if (cekumkm(raw_nilai,datanilai[z].id_umkm)) {//cek apakah id umkm sudah terdapat dalam array
                    //raw_nilai[z][i+1] = datanilai[z].nilai; // menambah kolom array
                    for (let q = 0; q < raw_nilai.length; q++) {
                      if (raw_nilai[q][0] == datanilai[z].id_umkm) {
                        raw_nilai[q][i+2] = datanilai[z].nilai; // menambah kolom array
                      }
                    }
                  }else {
                    raw_nilai.push([datanilai[z].id_umkm, datanilai[z].nama_umkm,datanilai[z].nilai]); //menambah baris array
                  }
                }
              }
            },
            error: function(xhr, status, error) {
              alert(xhr.responseText);
            }
          })

          kriteria.push({
            'id': datakriteria[i].id_kriteria,
            'nama': datakriteria[i].nama_kriteria,
            'sifat': datakriteria[i].sifat_kriteria,
            'bobot': datakriteria[i].bobot_kriteria,
            'nilaiterbaik': nilai_terbaik
          });



        }
      }
    },
    error: function(xhr, status, error) {
      alert(xhr.responseText);
    }
  }).done(function(data) {
    //console.log("Kriteria  = "+JSON.stringify(kriteria));
    window.localStorage.setItem("kriteria", JSON.stringify(kriteria));
    //console.log("Nilai RAW = "+JSON.stringify(raw_nilai));
    window.localStorage.setItem("nilai_raw", JSON.stringify(raw_nilai));



    //normalisasi
    let nilainorm;
    for (let i = 0; i < raw_nilai.length; i++) {//perulangan nilai umkm per umkm (baris)
      for (let j = 2; j < raw_nilai[i].length; j++) {//perulangan nilai umkm per kriteria (kolom)
        if (kriteria[j-2].sifat == "max") { // j-1 agar array kriteria dimulai dari index 0
          nilainorm = raw_nilai[i][j] / kriteria[j-2].nilaiterbaik; //rumus normalisasi jika benefit
        }else {
          nilainorm = kriteria[j-2].nilaiterbaik / raw_nilai[i][j]; //rumus normalisasi jika cost
        }

        //input hasil normalisasi ke dalam array normalisasi
        if (cekumkm(normalisasi,raw_nilai[i][0])) {//cek apakah id umkm sudah terdapat dalam array
          normalisasi[i][j] = nilainorm; // menambah kolom array
        }else {
          normalisasi.push([raw_nilai[i][0],raw_nilai[i][1],nilainorm]); //menambah baris array
        }
      }
    }

    //console.log("Normalisasi = "+JSON.stringify(normalisasi));
    window.localStorage.setItem("normalisasi", JSON.stringify(normalisasi));

    //mengkalikan nilai hasil normalisasi dengan bobot kriteria
    let hasilkali;
    let hasiltambah;
    for (let k = 0; k < normalisasi.length; k++) {
      hasiltambah = 0;
      for (let l = 2; l < normalisasi[k].length; l++) {
        hasilkali = normalisasi[k][l] * kriteria[l-2].bobot;
        hasiltambah += hasilkali; //menambah seluruh hasil perkalian kolom

        //input hasil perkalian ke dalam array pre_hasil
        if (cekumkm(pre_hasil,normalisasi[k][0])) {
          pre_hasil[k][l] = hasilkali;
        }else {
          pre_hasil.push([normalisasi[k][0],normalisasi[k][1],hasilkali]);
        }
      }

      //input hasil pertambahan ke dalam array hasilperhitungan
      if (cekumkm(hasilperhitungan,normalisasi[k][0])) {
        hasilperhitungan[k][l+2] = hasiltambah;
      }else {
        hasilperhitungan.push([normalisasi[k][0],normalisasi[k][1],hasiltambah]);
      }

      datahasil.push({
        'idhasil' : 'HS'+('00' + (k+1) ).slice(-3),
        'id': normalisasi[k][0],
        'nilai': hasiltambah
      });
    }
    window.localStorage.setItem("pre_hasil", JSON.stringify(pre_hasil));
    //console.log("Hasil Perkalian = "+JSON.stringify(pre_hasil));
    window.localStorage.setItem("hasilperhitungan", JSON.stringify(hasilperhitungan));
    //console.log("Hasil Perhitungan = "+JSON.stringify(hasilperhitungan));

    // determine the size of the object
    var size = sizeof(datahasil);
    console.log("Menggunakan Memori sebesar = "+JSON.stringify(size)+"bytes.");

    let end = performance.now();
    let end1 = new Date().getTime();
    let execs = (end1-start1) / 1000;
    console.log('Waktu Eksekusi = '+execs+ ' detik.');
    console.log("Membutuhkan Waktu sebesar = "+(end-start)+ " miliseconds.");
    document.getElementById("notif").innerHTML +=
    "<div class='alert alert-info alert-dismissible fade show' role='alert'><strong>Berhasil!</strong> "+datahasil.length+" data berhasil diolah dengan waktu eksekusi sebanyak "+ execs +" Detik dan menggunakan memori sebesar "+JSON.stringify(size)+" Bytes. <button type='button' class='close' data-dismiss='alert' aria-label='Close'>"
    +"<span aria-hidden='true'>&times;</span>"
    +"</button>"
    +"</div>";
    simpanhasil();
  })

});
