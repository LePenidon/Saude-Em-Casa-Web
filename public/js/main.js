$(document).ready(function () {
    //MATERIALIZE CONFIG
    $(".dropdown-trigger").dropdown({
        constrainWidth: false,
        coverTrigger: false,
        alignment: 'right'
    });
    $('.modal').modal({
        dismissible: false,
        onCloseStart: function () {
            $('.modal-content').scrollTop(0);
        },
        onCloseEnd: function () {
            $('form').trigger('reset');
            $('#adm_modal').find('#edit_text').hide();
            $('#ong_modal').find('#edit_text').hide();
            $('#adm_modal').find('#signup_text').show();
            $('#ong_modal').find('#signup_text').show();
            $('input[name="email"]').prop('disabled', false);
            $('#adm_modal').find('#submit').html('CADASTRAR');
            $('#ong_modal').find('#submit').html('CADASTRAR');
        }
    });
    $('.slider').slider({
        indicators: false,
        height: $(document).height()
    });
    $('.sidenav').sidenav();
});