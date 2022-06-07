import {Component} from '@angular/core';
import {ImageSets} from '../../model/consts';

@Component({
	selector: 'app-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss']
})
export class HelpComponent {
	sets = ImageSets;
	shortcuts = [
		{icon: 'icon-lightbulb', key: 'T', name: 'HINT'},
		{icon: 'icon-spin1', key: 'M', name: 'SHUFFLE'},
		{icon: 'icon-undo', key: 'U', name: 'UNDO'},
		{icon: 'icon-loop', key: 'N', name: 'RESTART'},
		{icon: 'icon-pause', key: 'P', name: 'PAUSE'},
		{icon: 'icon-calendar', key: 'I', name: 'INFO'},
		{icon: 'icon-cog', key: 'S', name: 'SETTINGS'},
		{key: 'H', name: 'HELP'}
	];
}
