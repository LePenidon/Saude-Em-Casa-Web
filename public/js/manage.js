$('.loading').hide();
const logout = function () {
    auth.signOut();
    return false;
}
$(window).on('load', function () {
    $('#logout').click(function () {
        logout();
    });

    // FORMS CONFIG
    const fillAddress = function () {
        $.ajax({
            url: 'https://viacep.com.br/ws/' + $form.find('input[name=cep]').val() + '/json/unicode/',
            dataType: 'json',
            success: function (res) {
                if (res.logradouro != null) {
                    $form.find("input[name=address]").val(res.logradouro + ', ' + res.bairro + ', ' + res.localidade + '-' + res.uf);
                } else {
                    $form.find("input[name=address]").val("Endereço Inválido");
                }
            }
        });
    }

    $('input[name=rg]').mask('AA-0Z.000.000', { translation: { 'Z': { pattern: /[0-9]/, optional: true }, 'A': { pattern: /[A-Za-z]/ } } });
    $('input[name=alternativePhone]').mask('(00)0000-0000');
    $('input[name=respPhone]').mask('(00)0 0000-0000');
    $('input[name=cnpj]').mask('00.000.000/0000-00');
    $('input[name=respCpf]').mask('000.000.000-00');
    $('input[name=phone]').mask('(00)0 0000-0000');
    $('input[name=birthday]').mask('00/00/0000');
    $('input[name=cpf]').mask('000.000.000-00');
    $('input[name=addressNum]').mask('00000');
    $('input[name=cep]').mask('00000-000');

    var $data = {};
    var $edit = false;
    var $admin = false;
    var $modal = $('.modal');
    var $form = $modal.find('form');
    $("input[name=cep]").focusout(fillAddress);

    auth.onAuthStateChanged(function (user) {
        if (user) {
            user.getIdTokenResult().then(idTokenResult => {
                user.admin = idTokenResult.claims.admin;
                user.institution = idTokenResult.claims.institution;
                if (user.admin) {
                    $admin = true;
                    setupUI(user);
                } else if (user.institution) {
                    $admin = false;
                    setupUI(user);
                } else auth.signOut();
            });
        } else {
            $(location).attr("href", "../");
        }
    });

    $form.submit(function () {
        var address = $form.find('input[name="address"').val();
        if (address == "Endereço Inválido") {
            errReset(false, 'Digite um CEP válido!');
        } else {
            $('#submit').addClass("disabled");
            $('.progress').css("visibility", "visible");

            var randomPass = Math.random().toString(36).slice(-8);
            var formArray = $form.serializeArray();
            $.each(formArray, function (index, field) {
                $data[field.name] = field.value;
            });

            if ($admin) {
                var collection = 'institutions';
            } else {
                var collection = 'pickers';
                $data['rating'] = 5;
                $data['isActive'] = true;
                $data['finishedRequests'] = 0;
                $data['institutionId'] = auth.currentUser.uid;
                $data['institutionName'] = auth.currentUser.displayName;
            }

            if ($edit) {
                db.collection(collection).doc($form.prop('id')).set($data).then(function () {
                    $modal.modal('close');
                    errReset(true, '<i class="material-icons" style="margin-right: 10px;">done</i>Salvo com Sucesso');
                }).catch(function (err) {
                    switch (err.code) {
                        case 'storage/retry-limit-exceeded': errReset(false, 'Tempo Excedido! Tente Novamente'); break;
                        case 'storage/unauthenticated': errReset(false, 'Falta de Permissões'); break;
                        case 'storage/invalid-checksum': errReset(false, 'Tente Novamente'); break;
                        default: errReset(false, 'Erro Desconhecido! Contate-nos'); break;
                    }
                    console.log(err);
                });
                $edit = false;
            } else {
                uAuth.createUserWithEmailAndPassword($data.email, randomPass).then(function (cred) {
                    uAuth.currentUser.updateProfile({ displayName: $data.name }).then(function () {
                        $data['userId'] = uAuth.currentUser.uid;
                        db.collection(collection).doc(cred.user.uid).set($data).then(function () {
                            var sendEmail = firebase.functions().httpsCallable('sendMail');
                            sendEmail({ email: $data.email, pass: randomPass, name: $data.name }).then(function (result) {
                                if ($admin) {
                                    errReset(true, '<i class="material-icons" style="margin-right: 10px;">done</i>Instituição Cadastrada');
                                } else {
                                    db.collection('emails').add({ email: $data.email });
                                    db.collection('institutions').doc(auth.currentUser.uid).update({
                                        'managedPickers': firebase.firestore.FieldValue.increment(1),
                                    });
                                    errReset(true, '<i class="material-icons" style="margin-right: 10px;">done</i>Usuário Cadastrado');
                                }
                                $modal.modal('close');
                            }).catch(function (err) {
                                errReset(true, '<i class="material-icons" style="margin-right: 10px;">close</i>Falha ao Enviar Email! Contate-nos');
                                $modal.modal('close');
                                console.log(err);
                            });
                        }).catch(function (err) {
                            switch (err.code) {
                                case 'storage/retry-limit-exceeded': errReset(false, 'Tempo Excedido! Tente Novamente'); break;
                                case 'storage/unauthenticated': errReset(false, 'Falta de Permissões'); break;
                                case 'storage/invalid-checksum': errReset(false, 'Tente Novamente'); break;
                                default: errReset(false, 'Erro Desconhecido! Contate-nos'); break;
                            }
                            console.log(err);
                        });
                        uAuth.signOut();
                    }).catch(function (err) {
                        console.log(err);
                    });
                }).catch(function (err) {
                    switch (err.code) {
                        case 'auth/network-request-failed': errReset(false, 'Tempo Excedido! Tente Novamente'); break;
                        case 'auth/email-already-in-use': errReset(false, 'Este Email Já Está Cadastrado'); break;
                        case 'auth/invalid-email': errReset(false, 'Email inválido'); break;
                        default: errReset(false, 'Erro Desconhecido! Contate-nos'); break;
                    }
                    console.log(err);
                });
            }
        }
        return false;
    });

    const setupUI = function (user) {
        var none, titles, query, query2, query3;
        var donors = [];
        if (user.admin) {
            $('#ong_button').hide();
            $('#watch_button').hide();
            $('#ong_mainTitle').hide();
            $('#adm_mainTitle').show();
            $('#profile-option').hide();

            none = $('#adm_null');
            titles = $('#adm_titles');
            query = db.collection('institutions').orderBy("name");

            $modal = $('#adm_modal');
            $form = $modal.find('form');
        } else if (user.institution) {
            $('#adm_button').hide();
            $('#adm_mainTitle').hide();
            $('#ong_mainTitle').show();
            $('#profile-option').show();

            none = $('#ong_null');
            titles = $('#ong_titles');
            query = db.collection('pickers').where("institutionId", "==", auth.currentUser.uid);
            $modal = $('#ong_modal');
            $form = $modal.find('form');
            $('#name').html(auth.currentUser.displayName);
        } else {
            auth.signOut();
            return false;
        }

        query.onSnapshot(function (querySnapshot) {
            if (querySnapshot.empty) {
                none.show();
                titles.hide();
            } else {
                none.hide();
                titles.show();
            }
            $('tbody').html('');
            querySnapshot.forEach(function (doc) {
                var name = doc.data().name;
                var num, rating, dado1;

                if (user.admin) {
                    num = doc.data().managedPickers;
                    if (num == undefined) num = '0';
                    $('tbody').append(
                        `<tr>
                        <td class="left">` + name + `</td>
                        <td>` + num + `</td>
                        <td class="row">
                            <div class="col s4 offset-s2">
                                <i class="material-icons black-text editOption" id="` + doc.id + `">edit</i>
                            </div>
                            <div class="col s4">
                                <i class="material-icons black-text deleteOption" id="` + doc.id + `">delete_forever</i>
                            </div>
                        </td>
                    </tr>`
                    );
                } else {
                    if (num == undefined) num = '0';
                    num = doc.data().finishedRequests;
                    rating = doc.data().rating.toFixed(2);
                    $('.gerencia_funcionarios').append(
                        `<tr>
                            <td class="left">` + name + `</td>
                            <td>` + num + `</td>
                            <td>` + rating + `</td>
                            <td class="row">
                                <div class="col s4 offset-s2">
                                    <i class="material-icons black-text editOption" id="` + doc.id + `">edit</i>
                                </div>
                                <div class="col s4">
                                    <i class="material-icons black-text deleteOption" id="` + doc.id + `">delete_forever</i>
                                </div>
                            </td>
                        </tr>`
                    );

                    query2 = db.collection('requestsMedic').where("pickerId", "==", doc.id).where("state", "==", 3);
                    query2.onSnapshot(function (query2Snapshot) {
                        query2Snapshot.forEach(function (docum) {
                            var teste = docum.data().donorId;

                            query3 = db.collection('donors').where("userId", "==", teste);
                            donors.push(teste);

                            for (var i = 0; i < donors.length; i++) {
                                var item = donors[i];
                                if (item != teste) {

                                } else {
                                    query3.onSnapshot(function (query3Snapshot) {
                                        query3Snapshot.forEach(function (docume) {
                                            var nomeDonor = docume.data().name;
                                            var p1 = docume.data().quest01; var p2 = docume.data().quest02; var p3 = docume.data().quest03; var p4 = docume.data().quest04; var p5 = docume.data().quest05; var p6 = docume.data().quest06; var p7 = docume.data().quest07;
                                            var p8 = docume.data().quest08; var p9 = docume.data().quest09; var p10 = docume.data().quest10; var p11 = docume.data().quest11; var p12 = docume.data().quest12; var p13 = docume.data().quest13; var p14 = docume.data().quest14;
                                            var p15 = docume.data().quest15; var p16 = docume.data().quest16; var p17 = docume.data().quest17; var p18 = docume.data().quest18; var p19 = docume.data().quest19; var p20 = docume.data().quest20;

                                            if (p1 == true) p1 = 'sim'; if (p1 == false) p1 = 'não'; if (p2 == true) p2 = 'sim'; if (p2 == false) p2 = 'não'; if (p3 == true) p3 = 'sim'; if (p3 == false) p3 = 'não'; if (p4 == true) p4 = 'sim'; if (p4 == false) p4 = 'não'; if (p5 == true) p5 = 'sim'; if (p5 == false) p5 = 'não'; if (p6 == true) p6 = 'sim'; if (p6 == false) p6 = 'não'; if (p7 == true) p7 = 'sim'; if (p7 == false) p7 = 'não'; if (p8 == true) p8 = 'sim'; if (p8 == false) p8 = 'não'; if (p9 == true) p9 = 'sim'; if (p9 == false) p9 = 'não'; if (p10 == true) p10 = 'sim'; if (p10 == false) p10 = 'não'; if (p11 == true) p11 = 'sim'; if (p11 == false) p11 = 'não'; if (p12 == true) p12 = 'sim'; if (p12 == false) p12 = 'não'; if (p13 == true) p13 = 'sim'; if (p13 == false) p13 = 'não'; if (p14 == true) p14 = 'sim'; if (p14 == false) p14 = 'não'; if (p15 == true) p15 = 'sim'; if (p15 == false) p15 = 'não'; if (p16 == true) p16 = 'sim'; if (p16 == false) p16 = 'não'; if (p17 == true) p17 = 'sim'; if (p17 == false) p17 = 'não'; if (p18 == true) p18 = 'sim'; if (p18 == false) p18 = 'não'; if (p19 == true) p19 = 'sim'; if (p19 == false) p19 = 'não';

                                            //colocar form aqui
                                            //começo da patifaria

                                            $('.historic').append(
                                                `<div class="center" style="margin-left:100px;margin-right:100px;background-color:#ffcdd2;border-width: thin;border-style: solid;border-color:#ef5350;">
                                        <u><b>Atendimento realizado por: ` + name + ` - Nome do paciente: 
                                        ` + nomeDonor + `</b></u><br>1.Doença cardíaca descompensada: ` + p1 + `;
                                        <br>2. Doença cardíaca congênita: ` + p2 + `;
                                        <br>3. Insuficiência cardíaca mal controlada: ` + p3 + `;
                                        <br>4. Doença cardíaca isquêmica descompensada: ` + p4 + `;
                                        <br>5. Doença respiratória descompensada: ` + p5 + `;
                                        <br>6. Asma ou doença pulmonar obstrutiva crônica (DPOC) mal controlada: ` + p6 + `;
                                        <br>7. Doença pulmonar com complicações: ` + p7 + `;
                                        <br>8. Fibrose cística com infecções recorrentes: ` + p8 + `;
                                        <br>9. Displasia broncopulmonar com complicações: ` + p9 + `;
                                        <br>10. Crianças prematuras com doença pulmonar crônica: ` + p10 + `;
                                        <br>11. Doença renal crônica em estágio avançado: ` + p11 + `;
                                        <br>12. Doença cromossômica: ` + p12 + `;
                                        <br>13. Diabetes: ` + p13 + `;
                                        <br>14. Gravidez de alto risco: ` + p14 + `;
                                        <br>15. Doença hepática em estágio avançado: ` + p15 + `;
                                        <br>16. Obeso com IMC igual ou maior que 40: ` + p16 + `;
                                        <br>17. Faz diálise ou hemodiálise: ` + p17 + `;
                                        <br>18. Recebeu transplante de órgãos sólidos e/ou medula óssea: ` + p18 + `;
                                        <br>19. Quimioterapia ou radioterapia: ` + p19 + `;
                                        <br>20. Outras doenças: ` + p20 + `;

                                        </div><br>`
                                            );

                                        });
                                        $('.loader').hide();
                                    }, function (err) {
                                        $('.loader').hide();
                                        console.log(err);
                                        if (err) M.toast({ html: 'Falha ao Carregar! Recarregue a Página' });
                                    });
                                }
                            }

                        });
                        $('.loader').hide();
                    }, function (err) {
                        $('.loader').hide();
                        console.log(err);
                        if (err) M.toast({ html: 'Falha ao Carregar! Recarregue a Página' });
                    });

                }
            });
            $('.loader').hide();
        }, function (err) {
            $('.loader').hide();
            console.log(err);
            if (err) M.toast({ html: 'Falha ao Carregar! Recarregue a Página' });
        });
    };

    $('tbody').on('click', '.editOption', function () {
        $('.loading').css('display', 'flex');
        $form.find('#signup_text').hide();
        $form.find('#edit_text').show();

        if ($admin) var collection = 'institutions';
        else var collection = 'pickers';
        var thisID = this.id;
        var fillData = {}

        var docRef = db.collection(collection).doc(thisID);
        docRef.get().then(function (doc) {
            $form.find('input[name="email"]').prop('disabled', true);
            $form.find('#submit').html('SALVAR');
            $form.attr('id', thisID);
            fillData = doc.data();
            $.each(fillData, function (index, field) {
                if (index != "pickers" || index != "pushToken" || index != "chattingWith" || index != "isActive" || index != "userId" || index != "rating") {
                    $form.find("input[name='" + index + "']").val(field);
                }
            });
            $('.loading').hide();
            $modal.modal('open');
            fillAddress();
            $edit = true;
        });
    });

    $('tbody').on('click', '.deleteOption', function () {
        $('#confirmation').attr('name', this.id);
        $('#confirmation').modal('open');
    });

    $('#confirm').click(function () {
        $('.progress').css("visibility", "visible");
        $('.confirm-btn').addClass("disabled");

        if ($admin) var collection = 'institutions';
        else var collection = 'pickers';

        db.collection(collection).doc($('#confirmation').attr('name')).get().then(function (doc) {
            db.collection(collection).doc($('#confirmation').attr('name')).delete().then(function () {
                if (!$admin) {
                    db.collection('emails').where('email', '==', doc.data().email).get().then(function (querySnapshot) {
                        querySnapshot.forEach(function (doc) {
                            db.collection('emails').doc(doc.id).delete().then(function () {
                                $('.modal').modal('close');
                                errReset(false, '<i class="material-icons" style="margin-right: 10px;">done</i>Usuário Removido com Sucesso');
                            });
                        });
                        db.collection('institutions').doc(auth.currentUser.uid).update({
                            'managedPickers': firebase.firestore.FieldValue.increment(-1),
                        });
                    }).catch(function (err) {
                        $('.modal').modal('close');
                        errReset(false, '<i class="material-icons" style="margin-right: 10px;">close</i>Falha ao Remover Usuário');
                        console.log(err);
                    });
                } else {
                    $('.modal').modal('close');
                    errReset(false, '<i class="material-icons" style="margin-right: 10px;">done</i>Usuário Removido com Sucesso');
                }
            });
        }).catch(function (err) {
            $('.modal').modal('close');
            errReset(false, '<i class="material-icons" style="margin-right: 10px;">close</i>Falha ao Remover Usuário');
            console.log(err);
        });
    });

    $('#pass-confirm').click(function () {
        $('.progress').css("visibility", "visible");
        $('.confirm-btn').addClass("disabled");

        auth.sendPasswordResetEmail(auth.currentUser.email).then(function () {
            errReset(false, '<i class="material-icons" style="margin-right: 10px;">done</i>Email Enviado');
        }).catch(function (err) {
            errReset(false, '<i class="material-icons" style="margin-right: 10px;">close</i>Falha ao Enviar Email');
            console.log(err);
        });
    });

    const errReset = function (reset, text) {
        $('.progress').css('visibility', 'hidden');
        $('.confirm-btn').removeClass("disabled");
        if (reset) $form.trigger('reset');
        if (text) M.toast({ html: text });
    }

    $('.modal-close').click(function () {
        $edit = false;
    });
});