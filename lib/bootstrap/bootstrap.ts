import Dropdown from 'bootstrap/js/dist/dropdown';
import Modal from 'bootstrap/js/dist/modal';
import * as Popper from '@popperjs/core';

// expose Popper
window['Popper'] = Popper;

export { Dropdown, Modal };
