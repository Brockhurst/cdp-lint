import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import '../less/all.less';
import * as padder from '../../node_modules/jsmp-infra-padder/lib';


$('.btn-primary').click(function () {
    console.log(padder.padString('abc', 'both', 8)); // eslint-disable-line no-console
});
