///////////////////////////////////////////////////
// 快捷鍵處理
///////////////////////////////////////////////////

document.body.addEventListener('keydown', e => onKey(e), { capture: true });

function onKey(e: KeyboardEvent): void {
	// 忽略條件
	if(document.querySelector('.modal-open') || e.metaKey || e.ctrlKey) return;

	let find = findKey(toKey(e), core.settings.hotkey);
	if(!find || !bp.design) return;

	// 防止觸發 Tab 的預設行為
	e.preventDefault();

	let [name, command] = find.split('.');
	if(name == 'm') handleMoveCommand(command);
	else if(name == 'v') handleViewCommand(command);
	else if(name == 'n') handleNavigationCommand(command);
	else handleDimensionCommand(command);
}

function handleMoveCommand(command: string): void {
	const map = {
		u: 'up',
		d: 'down',
		l: 'left',
		r: 'right',
	};
	bp.dragByKey(map[command]);
}

function handleNavigationCommand(command: string): void {
	if(command == 'd') return bp.goToDual();

	let repo = bp.getRepository();
	if(!repo) return;
	let f = command.endsWith('n') ? 1 : -1;
	if(command.startsWith('c')) repo.move(f);
	else if(repo.entry) repo.entry.move(f);
}

function handleViewCommand(command: string): void {
	if(!bp.design) return;
	if(command.startsWith('z')) {
		let sheet = bp.design.sheet, step = zoomStep(sheet.zoom);
		sheet.zoom += step * (command == 'zi' ? 1 : -1);
	} else {
		bp.design.mode = command == 't' ? 'tree' : 'layout';
	}
}

interface IRadius {
	radius: number;
}

interface ILength {
	length: number;
}

function handleDimensionCommand(command: string): void {
	if(!bp.design) return;
	let f = command.endsWith('i') ? 1 : -1;
	let sel = bp.selection.length ? bp.selection : [bp.design.sheet];
	for(let target of sel) {
		if(command.startsWith('w') && 'width' in target) target.width += f;
		else if(command.startsWith('h') && 'height' in target) target.height += f;
		else if('radius' in target) (target as IRadius).radius += f;
		else if('length' in target) (target as ILength).length += f;
	}
}
