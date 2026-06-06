// Basic DataTable
$(function () {
  $("#basicExample").DataTable({
    lengthMenu: [
      [5, 10, 12, 25, 50],
      [5, 10, 12, 25, 50, "All"],
    ],
    language: {
      lengthMenu: "Afficher _MENU_ Enregistrement par Page", //"Display _MENU_ Records Per Page"
      info: "Projection de la page _PAGE_ sur _PAGES_", //Showing Page _PAGE_ of _PAGES_
    },
  });
});

// Vertical Scroll
$(function () {
  $("#scrollVertical").DataTable({
    scrollY: "250px",
    scrollCollapse: true,
    paging: false,
    bInfo: false,
  });
});

// Highlighting rows and columns
$(function () {
  $("#highlightRowColumn").DataTable({
    lengthMenu: [
      [5, 10, 25, 50],
      [5, 10, 25, 50, "All"],
    ],
    language: {
      lengthMenu: "Display _MENU_ Records Per Page",
    },
  });
  var table = $("#highlightRowColumn").DataTable();
  $("#highlightRowColumn tbody").on("mouseenter", "td", function () {
    var colIdx = table.cell(this).index().column;
    $(table.cells().nodes()).removeClass("highlight");
    $(table.column(colIdx).nodes()).addClass("highlight");
  });
});

// Using API in callbacks
$(function () {
  $("#apiCallbacks").DataTable({
    lengthMenu: [
      [10, 25, 50],
      [10, 25, 50, "All"],
    ],
    language: {
      lengthMenu: "Display _MENU_ Records Per Page",
    },
    initComplete: function () {
      var api = this.api();
      api.$("td").on("click", function () {
        api.search(this.innerHTML).draw();
      });
    },
  });
});

// Hiding Search and Show entries
$(function () {
  $("#hideSearchExample").DataTable({
    lengthMenu: [
      [10, 25, 50],
      [10, 25, 50, "All"],
    ],
    searching: false,
    language: {
      lengthMenu: "Display _MENU_ Records Per Page",
      info: "Showing Page _PAGE_ of _PAGES_",
    },
  });
});

// Print Export Copy PDF Buttons
const exportTitle = 'Données extrait depuis la plateforme officiel de ONE LOVE';
$(function () {
  // On récupère le sous-titre dynamique depuis l'attribut data
  var dynamicSubtitle = $(this).data("export-subtitle") || "";
  $("#customButtons").DataTable({
    lengthMenu: [
      [10, 25, 50],
      [10, 25, 50, "All"],
    ],
    dom: "Bfrtip",
    // buttons: ["copy", "csv", "excel", "pdf", "print", "colvis"],
    buttons: [
      {
        extend: 'excel',
        title: exportTitle,
        exportOptions: {
          columns: ':visible' // n'exporte que les colonnes visibles
        }
      },
      {
        extend: 'pdf',
        title: typeof exportTitle !== 'undefined' ? exportTitle + '\n' + dynamicSubtitle : 'Rapport d\'Inventaire',
        exportOptions: { columns: ':visible' },
        orientation: 'portrait', 
        customize: function (doc) {
          // 1. Calcul du nombre de colonnes visibles
          const colCount = doc.content[1].table.body[0].length;
      
          // 2. Bascule dynamique paysage si > 7 colonnes
          if (colCount > 7) {
            doc.pageOrientation = 'landscape';
          }
      
          // 3. Force 100% de largeur et gère les retours à la ligne (wrapping)
          // Utile pour les libellés longs comme "FIZZI PAMPLEMOUSSE 0,33" 
          doc.content[1].table.widths = Array(colCount).fill('*');
      
          // 4. Gestion de l'affichage sur plusieurs pages
          doc.content[1].table.headerRows = 1; // Répète l'en-tête sur chaque page
          doc.content[1].table.dontBreakRows = true; // Empêche de couper une ligne de produit en deux
      
          // 5. Alignements et styles
          doc.styles.tableBodyEven.alignment = 'center';
          doc.styles.tableBodyOdd.alignment = 'center';
          doc.styles.tableHeader.alignment = 'center';
          
          // Ajustement de la taille de police pour assurer que tout rentre
          doc.defaultStyle.fontSize = 10; 
        }
      },
      {
        extend: 'csv',
        title: exportTitle,
        exportOptions: {
          columns: ':visible'
        }
      },
      {
        extend: 'copy',
        title: exportTitle,
        exportOptions: {
          columns: ':visible'
        }
      },
      {
        extend: 'print',
        title: exportTitle,
        exportOptions: {
          columns: ':visible'
        }
      },
    'colvis'
    ]
  });
});

// Print Export Copy PDF Buttons
// $(function () {
//   $(".customButtone").DataTable({
//     lengthMenu: [
//       [10, 25, 50],
//       [10, 25, 50, "All"],
//     ],
//     dom: "Bfrtip",
//     // buttons: ["copy", "csv", "excel", "pdf", "print", "colvis"],
//     buttons: [
//       {
//         extend: 'excel',
//         title: exportTitle,
//         exportOptions: {
//           columns: ':visible' // n'exporte que les colonnes visibles
//         }
//       },
//       {
//         extend: 'pdf',
//         title: exportTitle,
//         exportOptions: {
//           columns: ':visible'
//         }
//       },
//       {
//         extend: 'csv',
//         title: exportTitle,
//         exportOptions: {
//           columns: ':visible'
//         }
//       },
//       {
//         extend: 'copy',
//         title: exportTitle,
//         exportOptions: {
//           columns: ':visible'
//         }
//       },
//       {
//         extend: 'print',
//         title: exportTitle,
//         exportOptions: {
//           columns: ':visible'
//         }
//       }, 'colvis'
//     ]
//   });
//   // $(".customButtone").DataTable({
//   //   lengthMenu: [
//   //     [10, 25, 50],
//   //     [10, 25, 50, "All"],
//   //   ],
//   //   dom: "Bfrtip",
//   //   buttons: ["copy", "csv", "excel", "pdf", "print"],
//   // });
// });
function customButtone(selector = ".customButtone") {
  $(selector).each(function () {

    var dynamicSubtitle = $(this).data("export-subtitle") || "";
    let tableElement = $(this);

    // ===================================================
    // CREATION AUTO FOOTER
    // ===================================================
    if (tableElement.find('tfoot').length === 0) {
      let hasCalculableColumn = false;

      tableElement.find('thead th').each(function () {
        if (!$(this).hasClass('no-calc')) {
          hasCalculableColumn = true;
        }
      });

      if (hasCalculableColumn) {
        tableElement.find('tfoot.auto-footer').remove();
        let footer = $('<tfoot class="auto-footer"><tr></tr></tfoot>');

        tableElement.find('thead th').each(function (index) {
          let cellContent = '-';
          if (index === 0) {
            cellContent = 'Total';
          } else if (!$(this).hasClass('no-calc')) {
            cellContent = '0';
          }

          footer.find('tr').append(`
            <td class="text-center fw-bold">
              ${cellContent}
            </td>
          `);
        });

        tableElement.append(footer);
      }
    }

    // ===================================================
    // INITIALISATION DATATABLE
    // ===================================================
    if (!$.fn.DataTable.isDataTable(this)) {

      tableElement.DataTable({
        destroy: true,
        ordering: false,
        columnDefs: [
          {
              targets: '_all',
              className: 'text-center align-middle'
          }
        ],
        searchBuilder: true,

        // =================================================
        // LAYOUT DATATABLES 2
        // =================================================
        layout: {
          top1: {
            searchBuilder: {
              className: 'd-flex justify-content-center mb-2'
            }
          },
          topStart: {
            className: 'd-flex justify-content-between align-items-center gap-2 mb-2',
            features: [
              'buttons',
              'pageLength',
            ]
          },
          topEnd: {
            className: 'd-flex justify-content-center mb-2',
            features: [
              'search'
            ]
          }
        },

        // =================================================
        // BOUTONS
        // =================================================
        buttons: [
          {
            extend: 'excel',
            footer: true,
            title: typeof exportTitle !== 'undefined' ? exportTitle : "Export",
            filename: dynamicSubtitle ? dynamicSubtitle : "exportTitle",
            exportOptions: { columns: ':visible' }
          },
          {
            extend: 'pdf',
            footer: true,
            title: typeof exportTitle !== 'undefined'
              ? exportTitle + '\n' + dynamicSubtitle
              : 'Rapport d\'Inventaire',
            filename: dynamicSubtitle ? dynamicSubtitle : "exportTitle",
            exportOptions: { columns: ':visible' },
            orientation: 'portrait',

            customize: function (doc) {

              var tableNode = doc.content.find(node => node.table);
            
              if (tableNode) {
            
                const colCount = tableNode.table.body[0].length;
            
                if (colCount >= 5) {
                  doc.pageOrientation = 'landscape';
                }
            
                doc.pageMargins = [10, 20, 10, 20];
                tableNode.table.widths = Array(colCount).fill('*');
            
                // =========================
                // STYLE GLOBAL PLUS PRO
                // =========================
                // doc.defaultStyle.fontSize = colCount >= 10 ? 7 : (colCount >= 7 ? 8 : 9);
                if (colCount >= 10) {
                  doc.defaultStyle.fontSize = 6;
                  doc.styles.tableHeader.fontSize = 6;
                } else if (colCount >= 7) {
                  doc.defaultStyle.fontSize = 8;
                  doc.styles.tableHeader.fontSize = 9;
                } else {
                  doc.defaultStyle.fontSize = 9;
                  doc.styles.tableHeader.fontSize = 10;
                }
            
                doc.styles.title = {
                  fontSize: 16,
                  bold: true,
                  alignment: 'center',
                  color: '#1f2937'
                };
            
                doc.styles.tableHeader = {
                  bold: true,
                  fontSize: colCount >= 10 ? 8 : 10,
                  color: 'white',
                  fillColor: '#2563eb',   // 🔵 BLEU HEADER
                  alignment: 'center'
                };
            
                doc.styles.tableBodyEven = {
                  fillColor: '#f3f4f6'   // gris clair alterné
                };
            
                doc.styles.tableBodyOdd = {
                  fillColor: '#ffffff'
                };
            
                // =========================
                // CENTRAGE DES CELLULES
                // =========================
                tableNode.table.body.forEach(function (row, rowIndex) {
                  row.forEach(function (cell) {
                    if (rowIndex > 0) {
                      cell.alignment = 'center';
                      cell.margin = [2, 2, 2, 2];
                    }
                  });
                });
            
                // =========================
                // LAYOUT TABLE PLUS PRO
                // =========================
                tableNode.layout = {
                  hLineWidth: function () { return 0.5; },
                  vLineWidth: function () { return 0; },
                  hLineColor: function () { return '#e5e7eb'; },
            
                  paddingLeft: function () { return 4; },
                  paddingRight: function () { return 4; },
                  paddingTop: function () { return 3; },
                  paddingBottom: function () { return 3; }
                };
            
                tableNode.table.headerRows = 1;
                tableNode.table.dontBreakRows = true;
                tableNode.alignment = 'center';
              }
            
              // =========================
              // TITRE STYLE
              // =========================
              doc.styles.title = {
                fontSize: 16,
                bold: true,
                alignment: 'center',
                color: '#111827'
              };
            
              doc.styles.tableHeader.alignment = 'center';
            }
          },
          {
            extend: 'csv',
            title: typeof exportTitle !== 'undefined' ? exportTitle : "Export",
            exportOptions: { columns: ':visible' }
          },
          {
            extend: 'copy',
            title: typeof exportTitle !== 'undefined' ? exportTitle : "Export",
            exportOptions: { columns: ':visible' }
          },
          {
            extend: 'print',
            title: typeof exportTitle !== 'undefined' ? exportTitle : "Export",
            exportOptions: { columns: ':visible' }
          },
          'colvis'
        ],

        // =================================================
        // FOOTER CALCULATION
        // =================================================
        // footerCallback: function () {
        //   let api = this.api();
        //   let nombreColonnes = api.columns().count();

        //   for (let i = 0; i < nombreColonnes; i++) {
        //     let header = $(api.column(i).header());
        //     if (i === 0 || header.hasClass('no-calc')) continue;

        //     let total = 0;
        //     api.column(i, { search: 'applied' }).data().each(function (value) {
        //       let nombre = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
        //       if (!isNaN(nombre)) {
        //         total += nombre;
        //       }
        //     });

        //     let footerCell = api.column(i).footer();
        //     if (footerCell) {
        //       $(footerCell).html(total || 0);
        //     }
        //   }
        // },

        footerCallback: function () {
          let api = this.api();
          let nombreColonnes = api.columns().count();
      
          for (let i = 0; i < nombreColonnes; i++) {
      
              let footerCell = api.column(i).footer();
      
              if (footerCell) {
                  $(footerCell)
                      .addClass('text-center align-middle fw-bold');
              }
      
              let header = $(api.column(i).header());
      
              if (i === 0 || header.hasClass('no-calc')) continue;
      
              let total = 0;
      
              api.column(i, { search: 'applied' }).data().each(function (value) {
                  let nombre = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
                  if (!isNaN(nombre)) {
                      total += nombre;
                  }
              });
      
              if (footerCell) {
                  $(footerCell).html(total || 0);
              }
          }
        },

        // =================================================
        // LANGUE
        // =================================================
        language: {
          search: "Rechercher :",
          lengthMenu: "Afficher _MENU_ éléments",
          infoEmpty: "Affichage de 0 à 0 sur 0 élément",
          zeroRecords: "Aucun résultat trouvé",
          emptyTable: "Aucune donnée disponible",
          info: "Affichage de _START_ à _END_ sur _TOTAL_ éléments",
          paginate: {
            first: "Premier",
            last: "Dernier",
            next: "Suivant",
            previous: "Précédent"
          },
          buttons: {
            colvis: "Visibilité des colonnes",
            copy: "Copier",
            print: "Imprimer"
          },
          searchBuilder: {

            add: "Ajouter filtre",
            clearAll: "Tout effacer",
            condition: "Condition",
            data: "Colonne",
            value: "Valeur",
            logicAnd: "ET",
            logicOr: "OU",
        
            title: {
              0: "Filtres avancés",
              _: "Filtres avancés (%d)"
            },
        
            // 🔥 CONDITIONS ICI (IMPORTANT)
            conditions: {
              string: {
                contains: "Contient",
                empty: "Est vide",
                endsWith: "Se termine par",
                equals: "Égal à",
                not: "Différent de",
                notContains: "Ne contient pas",
                notEmpty: "N'est pas vide",
                notEndsWith: "Ne se termine pas par",
                notStartsWith: "Ne commence pas par",
                startsWith: "Commence par"
              },
              number: {
                between: "Entre",
                empty: "Est vide",
                equals: "Égal à",
                gt: "Supérieur à",
                gte: "Supérieur ou égal à",
                lt: "Inférieur à",
                lte: "Inférieur ou égal à",
                not: "Différent de",
                notBetween: "N'est pas entre",
                notEmpty: "N'est pas vide"
              },
              date: {
                after: "Après",
                before: "Avant",
                between: "Entre",
                empty: "Est vide",
                equals: "Égal à",
                not: "Différent de",
                notBetween: "N'est pas entre",
                notEmpty: "N'est pas vide"
              }
            }
          }
        },
        retrieve: true
      });
    }
  });
}

setTimeout(() => {
  customButtone();
},100)

function initCustomTable(selector = ".newCustomButtone") {

  $(selector).each(function () {

    var dynamicSubtitle = $(this).data("export-subtitle") || "";

    const caisse = window.currentCaisse || {};
    const periode = window.periode || {};

    let tableElement = $(this);

    // ===================================================
    // CREATION AUTO FOOTER
    // ===================================================
    if (tableElement.find('tfoot').length === 0) {

      let hasCalculableColumn = false;

      tableElement.find('thead th').each(function () {
        if (!$(this).hasClass('no-calc')) {
          hasCalculableColumn = true;
        }
      });

      if (hasCalculableColumn) {

        tableElement.find('tfoot.auto-footer').remove();

        let footer = $('<tfoot class="auto-footer"><tr></tr></tfoot>');

        tableElement.find('thead th').each(function (index) {

          let cellContent = '-';

          if (index === 0) {
            cellContent = 'Total';
          } else if (!$(this).hasClass('no-calc')) {
            cellContent = '0';
          }

          footer.find('tr').append(`
            <td class="text-center fw-bold">
              ${cellContent}
            </td>
          `);

        });

        tableElement.append(footer);
      }
    }

    // ============================
    // INITIALISATION DATATABLE
    // ============================
    tableElement.DataTable({

      footerCallback: function () {

        let api = this.api();
        let nombreColonnes = api.columns().count();

        for (let i = 0; i < nombreColonnes; i++) {

          let header = $(api.column(i).header());

          if (header.hasClass('no-calc')) continue;

          let total = 0;

          api.column(i, { search: 'applied' }).data().each(function (value) {

            if (!value) return;

            // 🔥 NETTOYAGE ROBUSTE (€, espaces, virgules)
            let nombre = parseFloat(
              String(value)
                .replace(/\s/g, '')
                .replace(/,/g, '.')
                .replace(/[^0-9.-]/g, '')
            );

            if (!isNaN(nombre)) {
              total += nombre;
            }

          });

          let footerCell = api.column(i).footer();

          if (footerCell) {
            $(footerCell).html(total.toFixed(2));
          }

        }

      },

      lengthMenu: [
        [10, 25, 50],
        [10, 25, 50, "All"],
      ],

      dom: "Bfrtip",

      buttons: [

        {
          extend: 'excel',
          footer: true,
          title: exportTitle,
          filename: dynamicSubtitle || "exportTitle",
          exportOptions: { columns: ':visible' }
        },

        {
          extend: 'pdf',
          footer: true,
          title: typeof exportTitle !== 'undefined'
            ? exportTitle + '\n' + dynamicSubtitle
            : "Rapport d'Inventaire",
          filename: dynamicSubtitle || "exportTitle",
          exportOptions: { columns: ':visible' },
          orientation: 'portrait',

          customize: function (doc) {

            var tableNode = doc.content.find(node => node.table);

            if (tableNode) {

              const colCount = tableNode.table.body[0].length;

              if (colCount >= 5) {
                doc.pageOrientation = 'landscape';
              }

              doc.pageMargins = [10, 20, 10, 20];
              tableNode.table.widths = Array(colCount).fill('*');

              // 🔥 FONT SIZE SAFE
              // doc.defaultStyle.fontSize = colCount >= 10 ? 7 : (colCount >= 7 ? 8 : 9);
              if (colCount >= 10) {
                doc.defaultStyle.fontSize = 6;
                doc.styles.tableHeader.fontSize = 6;
              } else if (colCount >= 7) {
                doc.defaultStyle.fontSize = 8;
                doc.styles.tableHeader.fontSize = 9;
              } else {
                doc.defaultStyle.fontSize = 9;
                doc.styles.tableHeader.fontSize = 10;
              }

              // 🔥 SAFE STYLES
              doc.styles.tableHeader = doc.styles.tableHeader || {};
              doc.styles.tableBodyEven = doc.styles.tableBodyEven || {};
              doc.styles.tableBodyOdd = doc.styles.tableBodyOdd || {};

              doc.styles.tableHeader.alignment = 'center';
              doc.styles.tableBodyEven.alignment = 'center';
              doc.styles.tableBodyOdd.alignment = 'center';

              // 🔥 HEADER CLEAN LINES
              tableNode.layout = {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0,
                paddingLeft: () => 3,
                paddingRight: () => 3,
                paddingTop: () => 2,
                paddingBottom: () => 2
              };

              tableNode.table.headerRows = 1;
              tableNode.table.dontBreakRows = true;
              tableNode.alignment = 'center';
            }

            // =========================
            // SAFE STYLES
            // =========================
            doc.styles.title = {
              fontSize: 16,
              bold: true,
              alignment: 'center'
            };

            doc.styles.message = doc.styles.message || {
              fontSize: 11,
              italic: true,
              alignment: 'center',
              margin: [0, 0, 0, 0]
            };

            // =========================
            // HEADER SAFE DATA
            // =========================
            const date_debut = periode.debut ? new Date(periode.debut) : null;
            const date_fin = periode.fin ? new Date(periode.fin) : null;

            doc.content.unshift(

              {
                text: 'RAPPORT D’INVENTAIRE DE STOCK',
                style: 'title',
                margin: [0, 0, 0, 8]
              },

              {
                text: 'ETAT DETAILLE DES MOUVEMENTS DE STOCK',
                alignment: 'center',
                italics: true,
                margin: [0, 0, 0, 15]
              },

              {
                table: {
                  widths: ['30%', '70%'],
                  body: [

                    ['CAISSE', caisse.nom || ''],
                    ['LIEU', `${caisse.nom_lieu || ''} (${caisse.type_lieu || ''})`],
                    ['ID CAISSE', caisse.slug_id || ''],
                    ['RESPONSABLE',
                      caisse.Personnels?.length
                        ? `${caisse.Personnels[0].nom} ${caisse.Personnels[0].prenom}`
                        : 'Non défini'
                    ],
                    ['DATE GÉNÉRATION', new Date().toLocaleString()],
                    ['PERIODE COUVERTE',
                      date_debut && date_fin
                        ? `Du ${date_debut.toLocaleString('fr-FR')} au ${date_fin.toLocaleString('fr-FR')}`
                        : '-'
                    ]

                  ]
                },

                layout: {
                  hLineColor: () => '#B8C7D1',
                  vLineColor: () => '#B8C7D1',
                  hLineWidth: () => 0.8,
                  vLineWidth: () => 0.8,
                  paddingLeft: () => 4,
                  paddingRight: () => 4,
                  paddingTop: () => 2,
                  paddingBottom: () => 2
                },

                margin: [0, 0, 0, 12]
              }

            );

          }
        },

        'csv', 'copy', 'print', 'colvis'
      ]
    });

  });
}


// function initCustomTable(selector = ".newCustomButtone") {

//   $(selector).each(function () {
  
//       var dynamicSubtitle = $(this).data("export-subtitle") || "";
  
//       // objet caisse injecté depuis data-export-objet
//       const caisse = window.currentCaisse;

//       console.log(caisse)
  
//       $(this).DataTable({
//         lengthMenu: [
//           [10,25,50],
//           [10,25,50,"All"]
//         ],
  
//         dom: "Bfrtip",
  
//         buttons: [
  
//           // =========================
//           // EXCEL
//           // =========================
//           {
//             extend: 'excel',
//             title: exportTitle,
//             filename: dynamicSubtitle || "Rapport_Inventaire",
//             exportOptions:{
//               columns:':visible'
//             }
//           },
  
//           // =========================
//           // PDF
//           // =========================
//           {
//             extend:'pdf',
  
//             title:
//               typeof exportTitle !== 'undefined'
//               ? exportTitle + '\n' + dynamicSubtitle
//               : "Rapport d'Inventaire",
  
//             filename:
//               dynamicSubtitle || "Rapport_Inventaire",
  
//             exportOptions:{
//               columns:':visible'
//             },
  
//             orientation:'portrait',
  
//             customize:function(doc){
  
//               // =====================================
//               // HEADER PROFESSIONNEL
//               // =====================================
  
//               doc.content.unshift(
  
//                 {
//                   text:'RAPPORT D’INVENTAIRE DE STOCK',
//                   style:'title',
//                   margin:[0,0,0,8]
//                 },
  
//                 {
//                   text:'ETAT DETAILLE DES MOUVEMENTS DE STOCK',
//                   alignment:'center',
//                   italics:true,
//                   margin:[0,0,0,15]
//                 },
  
//                 {
//                   table:{
//                     widths:['auto','*'],
//                     body:[
//                       [
//                         {text:'Caisse :',bold:true},
//                         caisse.nom || ''
//                       ],
//                       [
//                         {text:'Lieu :',bold:true},
//                         `${caisse.nom_lieu || ''} (${caisse.type_lieu || ''})`
//                       ],
//                       [
//                         {text:'ID Caisse :',bold:true},
//                         String(caisse.id_caisse || '')
//                       ],
//                       [
//                         {text:'Responsable :',bold:true},
//                         caisse.Personnels?.length
//                          ? `${caisse.Personnels[0].nom} ${caisse.Personnels[0].prenom}`
//                          : 'Non défini'
//                       ],
//                       [
//                         {text:'Date génération :',bold:true},
//                         new Date().toLocaleString()
//                       ]
//                     ]
//                   },
  
//                   layout:{
//                     hLineWidth:()=>0,
//                     vLineWidth:()=>0
//                   },
  
//                   margin:[0,0,0,12]
//                 },
  
//                 {
//                   canvas:[
//                     {
//                       type:'line',
//                       x1:0,
//                       y1:0,
//                       x2:760,
//                       y2:0,
//                       lineWidth:1
//                     }
//                   ],
//                   margin:[0,5,0,12]
//                 }
  
//               );
  
  
  
//               // =========================
//               // TABLE
//               // =========================
//               let tableNode = doc.content.find(
//                  node => node.table
//               );
  
  
//               if(tableNode){
  
//                 const colCount=
//                   tableNode.table.body[0].length;
  
  
//                 // paysage si beaucoup de colonnes
//                 if(colCount >= 5){
//                    doc.pageOrientation='landscape';
//                 }
  
  
//                 // marges réduites max
//                 doc.pageMargins=[5,20,5,20];
  
  
//                 // largeur auto répartie
//                 tableNode.table.widths=
//                   Array(colCount).fill('*');
  
  
//                 // police adaptive
//                 if(colCount>=12){
  
//                     doc.defaultStyle.fontSize=6;
//                     doc.styles.tableHeader.fontSize=7;
  
//                 }else if(colCount>=10){
  
//                     doc.defaultStyle.fontSize=7;
//                     doc.styles.tableHeader.fontSize=8;
  
//                 }else if(colCount>=7){
  
//                     doc.defaultStyle.fontSize=8;
//                     doc.styles.tableHeader.fontSize=9;
  
//                 }else{
  
//                     doc.defaultStyle.fontSize=9;
//                     doc.styles.tableHeader.fontSize=10;
//                 }
  
  
  
//                 // compacte les cellules
//                 tableNode.layout={
  
//                   hLineWidth:()=>0.3,
//                   vLineWidth:()=>0.3,
  
//                   paddingLeft:()=>1,
//                   paddingRight:()=>1,
//                   paddingTop:()=>1,
//                   paddingBottom:()=>1
//                 };
  
  
//                 tableNode.table.headerRows=1;
//                 tableNode.table.dontBreakRows=true;
  
//                 tableNode.alignment='center';
  
//               }
  
  
//               // =========================
//               // STYLES
//               // =========================
  
//               doc.styles.title={
//                 fontSize:16,
//                 bold:true,
//                 alignment:'center'
//               };
  
  
//               doc.styles.tableHeader={
//                 bold:true,
//                 alignment:'center',
//                 fontSize:9
//               };
  
//               doc.styles.tableBodyEven.alignment='center';
//               doc.styles.tableBodyOdd.alignment='center';
  
  
//               // =========================
//               // FOOTER
//               // =========================
  
//               doc.footer=function(currentPage,pageCount){
  
//                 return{
//                   columns:[
//                     {
//                       text:'OneLove ERP',
//                       alignment:'left',
//                       margin:[20,0]
//                     },
  
//                     {
//                       text:'Page '+currentPage+' / '+pageCount,
//                       alignment:'right',
//                       margin:[0,0,20,0]
//                     }
//                   ]
//                 };
  
//               };
  
//             }
//           },
  
//           'csv',
//           'copy',
//           'print',
//           'colvis'
//         ]
//       });
  
//   });
  
//   }

$(function () {
  $("#customButtonss").DataTable({
    lengthMenu: [
      [10, 25, 50],
      [10, 25, 50, "All"],
    ],
    dom: "Bfrtip",
    buttons: ["copy", "csv", "excel", "pdf", "print"],
  });
});

// Toggle Buttons
$(function () {
  $("#toggleButtons").DataTable({
    dom: "Bfrtip",
    buttons: ["columnsToggle"],
  });
});

// Space between buttons
$(function () {
  $("#spaceButtons").DataTable({
    dom: "Bfrtip",
    buttons: [
      "copy",
      "print",
      {
        extend: "spacer",
        style: "bar",
        text: "export files",
      },
      "csv",
      "excel",
      "spacer",
      "pdf",
    ],
  });
});

// Appoiuntments
$(function () {
  $("#noBInfo").DataTable({
    bInfo: false,
    paging: false,
    "ordering": false,
  });
});

// Attandance Vertical Scroll
$(function () {
  $("#attandance").DataTable({
    scrollCollapse: true,
    paging: false,
    bInfo: false,
    "ordering": false,
  });
});

// staffLeaves Vertical Scroll
$(function () {
  $("#staffLeaves").DataTable({
    scrollCollapse: true,
    paging: false,
    bInfo: false,
    "ordering": false,
  });
});

// Appoiuntments
$(function () {
  $("#appointmentsGrid").DataTable({
    bInfo: false,
    paging: false,
    "ordering": false,
  });
});