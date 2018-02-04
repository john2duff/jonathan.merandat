//définition du modèle
var model = function(){
    this.contact = getBd("contact");
    this.sujets = getBd("sujets");
    this.pageAccueil = getBd("PageAccueil");
}

var bd = {

    contact : {
        nom : "Merandat",
        prenom : "Jonathan",
    },

    pageAccueil : {
        h1 : "Bienvenue sur mon site !",
        sections : {
            section1 : {
                h5 :  "Je vous fais profiter de mon pense-bête"
            },
            section2 : {
                h5 :  "Vous pouvez cliquez sur mon profil en haut à gauche pour visualiser mon parcours."
            }
        }
    },

    sujets : {
        sujet1 : {
            h1 : "Informatique",
            img :{ 
                src : "img/logoInformatique.png",
                style : "width:100px;"
            },
            sections : {
                section1 : {
                    h2 : "Langages",
                    contenu : "",
                    chapitres : {
                        chapitre1 : {
                            h3 : "Javascript",
                            contenu : {},
                            sousChapitres : {
                                sousChapitre1 : {
                                    h4 : "Vocabulaire",
                                    introduction : {
                                        p : "Voici le vocabulaire du langage Javascript <br>" +
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" 
                                    },
                                    explication : {
                                        p : "liste"
                                    }
                                },
                                sousChapitre2 : {
                                    h4 : "Fonctions",
                                    introduction : {
                                        p : "Voici le vocabulaire du langage Javascript <br>" +
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" + 
                                        "Voici le vocabulaire du langage Javascript <br>" 
                                    },
                                    explication : {
                                        p : "liste"
                                    }
                            
                                }
                            }
                        }
                    }
                }, 
                section2 : {
                    h2 : "Outils",
                    contenu : "",
                    chapitres : {
                        chapitre1 : {
                            h3 : "Conversion Hexa - Binaire - Décimal",
                            contenu : "",
                            app : {
                                nomApp : "conversionHexaBinDec"
                            }
                        }
                    }
                }
            }
        }, 
        sujet2 :{
            h1 : "Musique",
            sections : {
                section1 : {
                    h2 : "Simulateur d'accords",
                }, 
            }
        },
        sujet3 :{
            h1 : "Casse-tête",
            sections : {
                section1 : {
                    h2 : "Rubik's cube",
                    chapitres : {
                        chapitre1 : {
                            h3 : "Notation ",
                            explication1 : "L'apostrophe après la lettre signifie que l'<b>on inverse le sens de rotation.</b>",
                            sousChapitres : {
                                flexGauche : {
                                    mouvementMajuscule : {
                                        h5 : "Les mouvements en majuscule",
                                        liste : [
                                                "U : Up",
                                                "D : Down",
                                                "R : Right",
                                                "L : Left",
                                                "F : Front",
                                                "B : Back"
                                            ]
                                    },
                                    sousChapitre2 : {
                                        h5 : "Les mouvements en minuscule",
                                        spanMouvementMajuscule : "Les lettres en minuscule correspondent au mouvement de base + la tranche juste à côté de celle-ci."
                                    },
                                    sousChapitre3 : {
                                        h5 : "Les mouvements en tranche central",
                                        liste : [
                                            "M : Middle <i>Tranche du milieu verticale et face à nous </i>", 
                                            "E : Equator <i>Tranche du milieu horizontale et face à nous </i>",
                                            "S : Standing <i>Tranche du milieu parallèle à nous </i>"
                                        ]
                                    }
                                },
                                
                            }
                        },
                        chapitre2 : {
                            h3 : "3 x 3 x 3",
                            sousChapitres : {
                                sousChapitre1 : {
                                    h4 : "Methode de Fridrich",
                                    etape1 : {
                                        h5 : "Etape 1 : Faire la croix",
                                    }, 
                                    etape2 : {
                                        h5 : "Etape 2 : Finir les deux premiers étages",
                                    }, 
                                    etape3 : {
                                        h5 : "Etape 3 : Orienter la dernière face",
                                        aretes : {
                                            h6 : "Pour les arêtes ",
                                            milieu : {
                                                arete1 : {
                                                    img :{ 
                                                        src : "img/arete1.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "FRUR'U'F'"   
                                                },
                                                arete2 : {
                                                    img :{ 
                                                        src : "img/arete2.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "FURU'R'F'"   
                                                },
                                                arete3 : {
                                                    img :{ 
                                                        src : "img/arete3.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "b'R'U'RUb"   
                                                },
                                                arete4 : {
                                                    img :{ 
                                                        src : "img/arete4.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "fRUR'U'f'"   
                                                },
                                                arete5 : {
                                                    img :{ 
                                                        src : "img/arete5.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "RU2'R2'FRF'U2R'FRF'"   
                                                },
                                            }
                                        }, 
                                        coins : {
                                            h6 : "Pour les coins ",
                                            milieu : {
                                                coin1 : {
                                                    img :{ 
                                                        src : "img/coin1.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "RUR'URU2'R'"   
                                                },
                                                coin2 : {
                                                    img :{ 
                                                        src : "img/coin2.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "RU2'R'U'RU'R'"   
                                                },
                                                coin3 : {
                                                    img :{ 
                                                        src : "img/coin3.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "RUR'URU'R'URU2'R'"   
                                                },
                                                coin4 : {
                                                    img :{ 
                                                        src : "img/coin4.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "RU2'R2'U'R2U'R2'U2R"   
                                                },
                                                coin5 : {
                                                    img :{ 
                                                        src : "img/coin5.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "l'URD'R'U'RDx'"   
                                                },
                                                coin6 : {
                                                    img :{ 
                                                        src : "img/coin6.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "l'U'LURU'r'F"   
                                                },
                                                coin7 : {
                                                    img :{ 
                                                        src : "img/coin7.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "R2D'RU2'R'DRU2'R"   
                                                },
                                            }
                                        }, 
                                    },
                                    etape4 : {
                                        h5 : "Etape 4 : Placer les éléments de la dernière face",
                                        fin : {
                                            milieu : {
                                                arete1 : {
                                                    img :{ 
                                                        src : "img/h.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "M2'UM2'U2M2'UM2'"   
                                                },
                                                arete2 : {
                                                    img :{ 
                                                        src : "img/z.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "U'M'UM2'UM2'UM'U2M2'"   
                                                },
                                                arete3 : {
                                                    img :{ 
                                                        src : "img/u.png",
                                                        style : "width:100px;"
                                                    },
                                                    mouvement : "M2'UM'U2'MUM2'"   
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }   
                    },
                }, 
                section2 : {
                    h2 : "Casse tete chinois", 
                    app : {
                        nomApp : "casseTeteChinois"
                    }
                }
            }
        },
        cv : {
            h1 : "Jonathan Merandat",
            sections : {
                section1 : {
                    h2 :  "Formations",
                    listeFormation : "<ul>  <b><li>2017 - 2019 : Master - Ingénierie Systèmes et Logiciels</b></li>" + 
                                "   <li>2016 - 2017 : Licence professionnelle - Systèmes Informatiques et Logiciels</li>" + 
                                "   <li>2009 - 2010 : Licence professionnelle - Formateur de milieu professionnel</li>" + 
                                "   <li>2007 - 2009 : DUT - Génie Mécanique et Productique</li>" + 
                                "   <li>2007        : Baccalauréat - STI Génie Mécanique</li>" + 
                            "</ul>"   
                },
                section2 : {
                    h2 :  "Expériences professionnelles"
                }
            }
        },
    },  
};

function getBd(element){
    var retour = bd;
    var tab = element.split("_");
    for (var i = 0; i< tab.length; i++){
        retour = retour[tab[i]];
    }
    return retour;
}


