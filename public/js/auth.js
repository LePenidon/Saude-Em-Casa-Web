$(window).on('load', function () {
    const $authForm = $('#auth_modal').find('form');
    $authForm.submit(function () {
        const email = $authForm.find('input[name="email"]').val();
        const pass = $authForm.find('input[name="pass"]').val();
        $('#submit').addClass("disabled");
        $('.progress').css('visibility', 'visible');
        auth.signInWithEmailAndPassword(email, pass).then(function (cred) {
            $('.modal').modal('close');
            errReset();
        }).catch(function (err) {
            switch (err.code) {
                case 'auth/network-request-failed': errReset('Tempo Excedido! Tente Novamente'); break;
                case 'auth/wrong-password': errReset('Email ou Senha Incorretos'); break;
                case 'auth/user-not-found': errReset('Usuário Não Encontrado'); break;
                case 'auth/user-disabled': errReset('Usuário Desativado'); break;
                default: errReset('Erro Desconhecido! Contate-nos'); break;
            }
        });
        return false;
    });

    auth.onAuthStateChanged(function (user) {
        if (user) {
            user.getIdTokenResult().then(idTokenResult => {
                if (idTokenResult.claims.admin || idTokenResult.claims.institution) $(location).attr("href", "gerencia/");
                else auth.signOut();
            });
        } else {
            $('.loader').hide();
        }
    });

    const errReset = function (text) {
        $('.progress').css('visibility', 'hidden');
        $('#submit').removeClass("disabled");
        $authForm.trigger('reset');
        $('input').blur();

        if (text) M.toast({ html: text });
    }

    $('.modal-trigger').click(function () {
        if (this.id == 'admins_btn') {
            $('#ongs_logo').hide();
            $('#admins_logo').show();
        } else if (this.id == 'ongs_btn') {
            $('#admins_logo').hide();
            $('#ongs_logo').show();
        }
    });
});