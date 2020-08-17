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
        var none, titles, query;
        if (user.admin) {
            $('#ong_button').hide();
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
                var num, rating;

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
                    $('tbody').append(
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