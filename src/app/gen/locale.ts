import type { BpsLocale } from "shared/frontend/locale";

export default {"en": {
	"name": _=>"English",
	"flag": _=>"usa",
	"emoji": _=>"🇺🇸",
	"since": 0,
	"welcome": {
		"title": _=>"Welcome to Box Pleating Studio!",
		"intro": [
			_=>"This app is made to help origami designers to make complex, crazy designs using box pleating and GOPS gadgets.",
			({normalize:n,interpolate:i,list:l})=>n(["To begin, click on the upper-left menu button to create an empty new project, or read our brief user manual on ",i(l(0))," (in English only)."])
		],
		"install": {
			"hint": _=>"You can also install BP Studio as a standalone app to your device, and use it offline!",
			"ios": _=>"How to install on iOS: Open this website in Safari, tap the \"Share\" icon at the bottom of\tyour screen, and then tap \"Add to home screen\".",
			"bt": _=>"Install Box Pleating Studio App",
			"prepare": _=>"Preparing for installation, please wait...",
			"ing": _=>"Installing app, please wait...",
			"ed": _=>"BP Studio is already installed on your device.",
			"open": _=>"Open Box Pleating Studio App"
		},
		"copyright": ({normalize:n,interpolate:i,list:l})=>n(["Copyright © 2020",i(l(0))," by Mu-Tsun Tsai"]),
		"recent": _=>"Recently used",
		"start": _=>"Start",
		"website": _=>"BP Studio website",
		"discord": ({normalize:n,interpolate:i,list:l})=>n(["Please join our ",i(l(0)),"!"])
	},
	"toolbar": {
		"file": {
			"title": _=>"Files",
			"new": _=>"New project",
			"open": _=>"Open projects / workspaces",
			"print": _=>"Print current view",
			"share": _=>"Share current project",
			"notFound": ({normalize:n,interpolate:i,list:l})=>n(["Unable to open file \"",i(l(0)),"\"; file not found."]),
			"recent": {
				"title": _=>"Open recent file",
				"empty": _=>"No records",
				"clear": _=>"Clear records"
			},
			"BPF": _=>"BP Studio formats",
			"BPS": {
				"name": _=>"BP Studio project",
				"download": _=>"Download current project",
				"save": _=>"Save project",
				"saveAs": _=>"Save project as...",
				"saveAll": _=>"Save all projects"
			},
			"BPZ": {
				"name": _=>"BP Studio workspace",
				"download": _=>"Download workspace",
				"save": _=>"Save workspace as..."
			},
			"PNG": {
				"name": _=>"PNG image",
				"download": _=>"Download current view as PNG",
				"save": _=>"Save current view as PNG",
				"copy": _=>"Copy current view as PNG"
			},
			"SVG": {
				"name": _=>"SVG image",
				"download": _=>"Download current view as SVG",
				"save": _=>"Save current view as SVG"
			}
		},
		"edit": {
			"title": _=>"Edit",
			"undo": _=>"Undo",
			"redo": _=>"Redo",
			"selectAll": _=>"Select all",
			"unselectAll": _=>"Unselect all"
		},
		"setting": {
			"title": _=>"Settings",
			"fullscreen": _=>"Fullscreen",
			"fullscreenExit": _=>"Exit fullscreen",
			"grid": _=>"Show grid lines",
			"hinge": _=>"Show hinge creases",
			"ridge": _=>"Show ridge creases",
			"axial": _=>"Show axial-parallel creases in gadgets",
			"label": _=>"Show labels",
			"tip": _=>"Show flap tips",
			"dPad": _=>"Show D-pad",
			"status": _=>"Show status bar",
			"preference": _=>"Preferences"
		},
		"tools": {
			"title": _=>"Tools",
			"TreeMaker": _=>"Import TreeMaker file",
			"CP": {
				"_": _=>"Export CP file",
				"reorient": _=>"Reorient the sheet if applicable"
			}
		},
		"help": {
			"title": _=>"Help",
			"about": _=>"About",
			"news": _=>"Version info",
			"update": _=>"Ready to update",
			"checkUpdate": _=>"Check for update",
			"donation": _=>"Donation",
			"discussions": _=>"Discussions",
			"issue": _=>"Report issue",
			"homepage": _=>"Homepage"
		},
		"view": {
			"tree": _=>"Tree structure",
			"layout": _=>"Layout"
		},
		"tab": {
			"clone": _=>"Clone",
			"close": _=>"Close",
			"closeAll": _=>"Close all",
			"closeOther": _=>"Close others",
			"closeRight": _=>"Close all to the right",
			"noTitle": _=>"(no title)"
		},
		"panel": _=>"Option panel"
	},
	"preference": {
		"general": _=>"General",
		"color": {
			"_": _=>"Colors",
			"default": _=>"Default",
			"border": _=>"Border lines",
			"grid": _=>"Grid lines",
			"hinge": _=>"Hinge creases",
			"ridge": _=>"Ridge creases",
			"axisParallel": _=>"Axis-parallel creases",
			"overlap": _=>"Overlapping",
			"tip": _=>"Flap tips",
			"label": _=>"Text label"
		},
		"hotkey": _=>"Hotkeys",
		"command": _=>"Command",
		"language": _=>"Language",
		"theme": {
			"_": _=>"Theme",
			"dark": _=>"Dark theme",
			"light": _=>"Light theme",
			"system": _=>"Use system settings"
		},
		"reset": _=>"Reset all settings to default",
		"confirmReset": _=>"Are you sure you want to reset all settings to default?",
		"confirmKey": ({normalize:n,interpolate:i,list:l})=>n(["Hotkey ",i(l(0))," is already assigned to the command \"",i(l(1)),"\"; would you like to replace it?"]),
		"autoSave": _=>"Save workspace automatically",
		"includeHidden": _=>"Include hidden elements in SVG exports",
		"loadSessionOnQueue": _=>"Load previous session when directly open a project file"
	},
	"panel": {
		"design": {
			"type": _=>"Box Pleating Studio Project",
			"title": _=>"Title",
			"titlePH": _=>"(Project title)",
			"descriptionPH": _=>"(Project description)",
			"tree": _=>"Tree structure view",
			"layout": _=>"Layout view",
			"width": _=>"Width",
			"height": _=>"Height",
			"size": _=>"Size",
			"zoom": _=>"Zoom",
			"grid": {
				"_": _=>"Type",
				"rect": _=>"Rectangular grid",
				"diag": _=>"Diagonal grid"
			}
		},
		"flap": {
			"type": _=>"Flap",
			"name": _=>"Name",
			"radius": _=>"Radius",
			"width": _=>"Width",
			"height": _=>"Height",
			"goto": _=>"Go to vertex"
		},
		"flaps": {
			"type": _=>"Flaps",
			"goto": _=>"Go to vertices"
		},
		"river": {
			"type": _=>"River",
			"width": _=>"Width",
			"goto": _=>"Go to edge"
		},
		"rivers": {
			"type": _=>"Rivers"
		},
		"vertex": {
			"type": _=>"Vertex",
			"name": _=>"Name",
			"addLeaf": _=>"Add leaf",
			"ofLength": _=>"of length",
			"delJoin": _=>"Delete and join",
			"goto": _=>"Go to flap"
		},
		"vertices": {
			"type": _=>"Vertices",
			"goto": _=>"Go to flaps"
		},
		"edge": {
			"type": _=>"Edge",
			"length": _=>"Length",
			"split": _=>"Split",
			"merge": _=>"Merge end vertices",
			"goto": _=>"Go to river"
		},
		"repo": {
			"type": _=>"Stretch",
			"config": _=>"Configuration",
			"pattern": _=>"Pattern",
			"onlyOne": _=>"Only one pattern is found."
		}
	},
	"status": {
		"invalid": _=>"Invalid overlaps"
	},
	"share": {
		"title": _=>"Share project",
		"copy": _=>"Copy",
		"share": _=>"Share",
		"message": ({normalize:n,interpolate:i,list:l})=>n(["Check out my project \"",i(l(0)),"\" designed with Box Pleating Studio!"])
	},
	"about": {
		"title": _=>"About Box Pleating Studio",
		"license": _=>"Released under the MIT license.",
		"manual": ({normalize:n,interpolate:i,list:l})=>n(["For user manual, visit the app's ",i(l(0)),"."]),
		"feedback": ({normalize:n,interpolate:i,list:l})=>n(["For feedback, visit the app's ",i(l(0)),"."]),
		"repo": _=>"Github repository",
		"donation": ({normalize:n,interpolate:i,list:l})=>n(["BP Studio is completely free to use. If you find this app helpful to your designing and are interested in supporting this app, you can donate any amount with ",i(l(0)),"."]),
		"visitBlog": ({normalize:n,interpolate:i,list:l})=>n(["Also visit author's ",i(l(0))," for more info!"]),
		"blog": _=>"blog",
		"sponsor": _=>"BP Studio is proudly sponsored by:"
	},
	"donate": {
		"title": _=>"Supporting Box Pleating Studio",
		"intro": _=>"Thank you for considering supporting Box Pleating Studio! Please enter any amount you would like to donate. You can buy me a coffee with $1, or a dinner with $10, etc. 😄 (PayPal handling fee will be added during checkout)",
		"error": _=>"Please enter a number",
		"then": _=>"Then click the button below and follow the instructions to complete.",
		"wait": _=>"Please wait until PayPal complete your transaction...",
		"nextTime": _=>"Maybe next time",
		"thank": ({normalize:n,interpolate:i,list:l})=>n(["Thank you very much, ",i(l(0)),", for your kind donation!"])
	},
	"message": {
		"connFail": _=>"Internet connection failed; please try again later.",
		"downloadHint": _=>"Right-click and use \"Save As\" to choose file location.",
		"filePermission": _=>"For security reason, BP Studio needs your permission to access the file. For each file, you'll only need to grant permission once per session. Do you still wish to access the file?",
		"fatal": _=>"An internal error occurred, and the project cannot be further operated.",
		"recover": _=>"The workspace will be recovered automatically, but the error will likely persist. Please download the error log and send it to the author for diagnosing the issue.",
		"recoverFailed": _=>"Recovery failed.",
		"invalidFormat": ({normalize:n,interpolate:i,list:l})=>n(["File \"",i(l(0)),"\" is of invalid format."]),
		"invalidLink": _=>"Unexpected error occurred upon opening the project link; the data might be corrupted.",
		"latest": _=>"You already have the latest version of BP Studio.",
		"min3vertex": _=>"The tree needs to have at least 3 vertices.",
		"oldVersion": ({normalize:n,interpolate:i,list:l})=>n(["Project \"",i(l(0)),"\" was created with an older version of BP Studio, and some stretch patterns may need to be re-selected. It will be updated to the latest format on the next saving."]),
		"patternNotFound": _=>"Some of the overlappings of flaps in this design are valid, but for now BP Studio is unable to find working stretch patterns for them. The author of this app will continue to implement more algorithms to cover more cases.",
		"unsaved": ({normalize:n,interpolate:i,list:l})=>n(["Project \"",i(l(0)),"\" contains unsaved changes. Discard the changes?"]),
		"updateReady": _=>"A newer version of BP Studio is ready and will update automatically on restart. Would you like to restart now?",
		"restartFail": _=>"Unable to restart. Please close all instances of BP Studio.",
		"webGL": {
			"title": _=>"WebGL initialization failed",
			"body": _=>"BP Studio requires WebGL to run, but is unable to initialize WebGL context. Please check your browser's settings."
		},
		"inApp": _=>"It seems that you are using an in-app browser. Downloading might not work."
	},
	"plugin": {
		"TreeMaker": {
			"not5": ({normalize:n,interpolate:i,list:l})=>n(["File \"",i(l(0)),"\" is not of TreeMaker 5 format."]),
			"size8": _=>"BP Studio requires sheet size at least 8.",
			"invalid": ({normalize:n,interpolate:i,list:l})=>n(["File \"",i(l(0)),"\" seems corrupted and cannot be loaded successfully."])
		},
		"optimizer": {
			"_": _=>"Optimize layout",
			"options": {
				"_": _=>"Options",
				"openNew": _=>"Show result in a new tab",
				"useDim": _=>"Keep widths and heights of flaps"
			},
			"layout": {
				"_": _=>"Layout method",
				"view": _=>"Use current layout as reference",
				"random": _=>"Try random layouts and use the best one",
				"toTry": _=>"Number of layouts to try:",
				"useBH": _=>"Also search nearby solutions"
			},
			"fit": {
				"_": _=>"Fitting method",
				"quick": _=>"Quick mode",
				"full": _=>"Full mode"
			},
			"skip": _=>"Skip",
			"run": _=>"Run!",
			"running": _=>"Running..."
		}
	},
	"keyword": {
		"yes": _=>"Yes",
		"no": _=>"No",
		"ok": _=>"OK",
		"here": _=>"here",
		"abort": _=>"Abort",
		"close": _=>"Close",
		"cancel": _=>"Cancel",
		"export": _=>"Export",
		"delete": _=>"Delete",
		"discord": _=>"BP Studio Discord server",
		"version": _=>"Version",
		"filename": _=>"Filename",
		"download": _=>"Download",
		"homepage": _=>"homepage",
		"untitled": _=>"Untitled",
		"errorLog": _=>"Download error log",
		"workspace": _=>"workspace"
	}
}
,
"es": {
	"name": _=>"Español",
	"flag": _=>"spain",
	"emoji": _=>"🇪🇸",
	"since": 900,
	"welcome": {
		"title": _=>"¡Bienvenido a Box Pleating Studio!",
		"intro": [
			_=>"Esta aplicación se ha desarrollado para ayudar a los diseñadores de origami a crear modelos complejos y sorprendentes utilizando pliegues en grilla cuadriculada (box pleating) y dispositivos GOPS.",
			({normalize:n,interpolate:i,list:l})=>n(["Para comenzar, haga clic en el botón del menú superior izquierdo para crear un nuevo proyecto o lea el manual de usuario en ",i(l(0))," (solo en inglés)."])
		],
		"install": {
			"hint": _=>"¡También puede instalar BP Studio como una aplicación independiente en su dispositivo y usarla sin conexión!",
			"ios": _=>"Cómo instalar en iOS: Abra este sitio web en Safari, toque el icono \"Compartir\" en la parte inferior de la pantalla y luego toque \"Agregar a la pantalla de inicio\".",
			"bt": _=>"Instalar la aplicación Box Pleating Studio",
			"prepare": _=>"Preparándose para la instalación, espere ...",
			"ing": _=>"Instalando la aplicación, espere ...",
			"ed": _=>"BP Studio ya está instalado en su dispositivo.",
			"open": _=>"Aplicación Open Box Pleating Studio"
		},
		"copyright": ({normalize:n,interpolate:i,list:l})=>n(["Copyright © 2020",i(l(0))," por Mu-Tsun Tsai"]),
		"recent": _=>"Recientemente usado",
		"start": _=>"Comienzo",
		"website": _=>"Sitio web de BP Studio",
		"discord": ({normalize:n,interpolate:i,list:l})=>n(["¡Únase a nuestro ",i(l(0)),"!"])
	},
	"toolbar": {
		"file": {
			"title": _=>"Archivos",
			"new": _=>"Nuevo proyecto",
			"open": _=>"Proyectos abiertos / espacios de trabajo",
			"print": _=>"Imprimir vista actual",
			"share": _=>"Compartir proyecto actual",
			"notFound": ({normalize:n,interpolate:i,list:l})=>n(["No se puede abrir el archivo \"",i(l(0)),"\"; archivo no encontrado."]),
			"recent": {
				"title": _=>"Abrir archivo reciente",
				"empty": _=>"No hay registros",
				"clear": _=>"Vaciar registros"
			},
			"BPF": _=>"Formatos de BP Studio",
			"BPS": {
				"name": _=>"Proyecto BP Studio",
				"download": _=>"Descargar proyecto actual",
				"save": _=>"Guardar proyecto",
				"saveAs": _=>"Guardar proyecto como...",
				"saveAll": _=>"Guardar todos los proyectos"
			},
			"BPZ": {
				"name": _=>"Espacio de trabajo de BP Studio",
				"download": _=>"Descargar espacio de trabajo",
				"save": _=>"Guardar espacio de trabajo como ..."
			},
			"PNG": {
				"name": _=>"Imagen PNG",
				"download": _=>"Descargar la vista actual como PNG",
				"save": _=>"Guardar la vista actual como PNG",
				"copy": _=>"Copiar la vista actual como PNG"
			},
			"SVG": {
				"name": _=>"Imagen SVG",
				"download": _=>"Descargar la vista actual como SVG",
				"save": _=>"Guardar la vista actual como SVG"
			}
		},
		"edit": {
			"title": _=>"Editar",
			"undo": _=>"Deshacer",
			"redo": _=>"Rehacer",
			"selectAll": _=>"Seleccionar todo",
			"unselectAll": _=>"Deselecciona todo"
		},
		"setting": {
			"title": _=>"Ajustes",
			"fullscreen": _=>"Pantalla completa",
			"fullscreenExit": _=>"Salir de pantalla completa",
			"grid": _=>"Mostrar líneas de cuadrícula",
			"hinge": _=>"Mostrar pliegues de bisagra",
			"ridge": _=>"Mostrar pliegues de cresta",
			"axial": _=>"Mostrar pliegues axiales-paralelos en gadgets",
			"label": _=>"Mostrar etiquetas",
			"tip": _=>"Mostrar puntas de solapa",
			"dPad": _=>"Mostrar D-pad",
			"status": _=>"Mostrar barra de estado",
			"preference": _=>"Preferencias"
		},
		"tools": {
			"title": _=>"Herramientas",
			"TreeMaker": _=>"Importar archivo TreeMaker",
			"CP": {
				"_": _=>"Exportar archivo CP",
				"reorient": _=>"Reorientar la hoja si corresponde"
			}
		},
		"help": {
			"title": _=>"Ayuda",
			"about": _=>"Acerca de",
			"news": _=>"Información de la versión",
			"update": _=>"Listo para actualizar",
			"checkUpdate": _=>"Buscar actualizaciones",
			"donation": _=>"Donación",
			"discussions": _=>"Discusiones",
			"issue": _=>"Reportar error",
			"homepage": _=>"Página principal"
		},
		"view": {
			"tree": _=>"Estructura de árbol",
			"layout": _=>"Diseño"
		},
		"tab": {
			"clone": _=>"Clonar",
			"close": _=>"Cerrar",
			"closeAll": _=>"Cerrar todo",
			"closeOther": _=>"Cerrar otros",
			"closeRight": _=>"Cerrar todo a la derecha",
			"noTitle": _=>"(Sin título)"
		},
		"panel": _=>"Panel de opciones"
	},
	"preference": {
		"general": _=>"General",
		"color": {
			"_": _=>"Colores",
			"default": _=>"Por defecto",
			"border": _=>"Líneas fronterizas",
			"grid": _=>"Líneas de cuadrícula",
			"hinge": _=>"Pliegues de bisagra",
			"ridge": _=>"Pliegues de cresta",
			"axisParallel": _=>"Pliegues axiales-paralelos",
			"overlap": _=>"Superpuestas",
			"tip": _=>"Puntas de solapa",
			"label": _=>"Etiqueta de texto"
		},
		"hotkey": _=>"Acceso rápido",
		"command": _=>"Mando",
		"language": _=>"Idioma",
		"theme": {
			"_": _=>"Tema",
			"dark": _=>"Tema oscuro",
			"light": _=>"Tema claro",
			"system": _=>"Usar la configuración del sistema"
		},
		"reset": _=>"Restablecer todas las configuraciones",
		"confirmReset": _=>"¿Está seguro de que desea restablecer todas las configuraciones a las predeterminadas?",
		"confirmKey": ({normalize:n,interpolate:i,list:l})=>n(["La tecla de acceso rápido ",i(l(0))," ya está asignada al comando \"",i(l(1)),"\"; ¿te gustaría reemplazarlo?"]),
		"autoSave": _=>"Guardar el espacio de trabajo automáticamente",
		"includeHidden": _=>"Incluir elementos ocultos en las exportaciones SVG",
		"loadSessionOnQueue": _=>"Cargar la sesión anterior al abrir directamente un archivo de proyecto"
	},
	"panel": {
		"design": {
			"type": _=>"Proyecto de Box Pleating Studio",
			"title": _=>"Título",
			"titlePH": _=>"(Título del Proyecto)",
			"descriptionPH": _=>"(Descripción del Proyecto)",
			"tree": _=>"Vista de estructura de árbol",
			"layout": _=>"Vista de maquetación",
			"width": _=>"Ancho",
			"height": _=>"Alto",
			"size": _=>"Tamaño",
			"zoom": _=>"Zoom",
			"grid": {
				"_": _=>"Tipo",
				"rect": _=>"Cuadrícula rectangular",
				"diag": _=>"Cuadrícula diagonal"
			}
		},
		"flap": {
			"type": _=>"Solapa",
			"name": _=>"Nombre",
			"radius": _=>"Radio",
			"width": _=>"Ancho",
			"height": _=>"Altura",
			"goto": _=>"Ir al vértice"
		},
		"flaps": {
			"type": _=>"Solapas",
			"goto": _=>"Ir a vértices"
		},
		"river": {
			"type": _=>"Río",
			"width": _=>"Ancho",
			"goto": _=>"Ir al borde"
		},
		"rivers": {
			"type": _=>"Ríos"
		},
		"vertex": {
			"type": _=>"Vértice",
			"name": _=>"Nombre",
			"addLeaf": _=>"Agregar hoja",
			"ofLength": _=>"de longitud",
			"delJoin": _=>"Eliminar y unirse",
			"goto": _=>"Ir a la solapa"
		},
		"vertices": {
			"type": _=>"Vértices",
			"goto": _=>"Ir a solapas"
		},
		"edge": {
			"type": _=>"Borde",
			"length": _=>"Largo",
			"split": _=>"Separar",
			"merge": _=>"Fusionar vértices finales",
			"goto": _=>"Ir al río"
		},
		"repo": {
			"type": _=>"Tramo",
			"config": _=>"Configuración",
			"pattern": _=>"Patrón",
			"onlyOne": _=>"Solo se encuentra un patrón."
		}
	},
	"status": {
		"invalid": _=>"Superposiciones no válidas"
	},
	"share": {
		"title": _=>"Compartir proyecto",
		"copy": _=>"Copiar",
		"share": _=>"Cuota",
		"message": ({normalize:n,interpolate:i,list:l})=>n(["¡Mira mi proyecto \"",i(l(0)),"\" diseñado con Box Pleating Studio!"])
	},
	"about": {
		"title": _=>"Acerca de Box Pleating Studio",
		"license": _=>"Publicado bajo licencia MIT.",
		"manual": ({normalize:n,interpolate:i,list:l})=>n(["Para obtener el manual del usuario, visite el ",i(l(0))," de la aplicación."]),
		"feedback": ({normalize:n,interpolate:i,list:l})=>n(["Para obtener comentarios, visite el ",i(l(0))," de la aplicación."]),
		"repo": _=>"Repositorio de Github",
		"donation": ({normalize:n,interpolate:i,list:l})=>n(["BP Studio es de uso completamente gratuito. Si encuentra esta aplicación útil para su diseño y está interesado en apoyarla, puede donar cualquier cantidad con ",i(l(0)),"."]),
		"visitBlog": ({normalize:n,interpolate:i,list:l})=>n(["¡También visite el ",i(l(0))," del autor para obtener más información!"]),
		"blog": _=>"Blog",
		"sponsor": _=>"BP Studio está orgullosamente patrocinado por:"
	},
	"donate": {
		"title": _=>"Box Pleating Studio de apoyo",
		"intro": _=>"¡Gracias por considerar su apoyo a Box Pleating Studio! Indique la cantidad que le gustaría donar. Puedes comprarme un café con $ 1 o una cena con $ 10, etc. 😄 (la comisión de PayPal se agregará durante el pago)",
		"error": _=>"Por favor, introduzca un número",
		"then": _=>"A continuación haga clic en el botón de abajo y siga las instrucciones para completar el pago.",
		"wait": _=>"Espere hasta que PayPal complete su transacción ...",
		"nextTime": _=>"Quizás la próxima vez",
		"thank": ({normalize:n,interpolate:i,list:l})=>n(["¡Muchas gracias, ",i(l(0)),", por tu amable donación!"])
	},
	"message": {
		"connFail": _=>"Falló la conexión a Internet; Por favor, inténtelo de nuevo más tarde.",
		"downloadHint": _=>"Haz clic en el botón derecho y usa \"Guardar enlace como\" para elegir la ubicación del archivo.",
		"filePermission": _=>"Por motivos de seguridad, BP Studio necesita su permiso para acceder al archivo. Para cada archivo, solo necesitará otorgar permiso una vez por sesión. ¿Aún desea acceder al archivo?",
		"fatal": _=>"Se produjo un error interno y el proyecto no se puede seguir utilizando.",
		"recover": _=>"El espacio de trabajo se recuperará automáticamente, pero es probable que el error persista. \nDescargue el registro de errores y envíelo al autor para diagnosticar el problema.",
		"recoverFailed": _=>"La recuperación falló.",
		"invalidFormat": ({normalize:n,interpolate:i,list:l})=>n(["El archivo \"",i(l(0)),"\" tiene un formato no válido."]),
		"invalidLink": _=>"Se produjo un error inesperado al abrir el enlace del proyecto; \nlos datos pueden estar corruptos.",
		"latest": _=>"Ya tienes la última versión de BP Studio.",
		"min3vertex": _=>"El árbol debe tener al menos 3 vértices.",
		"oldVersion": ({normalize:n,interpolate:i,list:l})=>n(["El proyecto \"",i(l(0)),"\" se creó con una versión anterior de BP Studio y es posible que sea necesario volver a seleccionar algunos patrones de estiramiento. Se actualizará al formato más reciente cuando vuelva a guardarlo."]),
		"patternNotFound": _=>"Algunas de las superposiciones de solapas en este diseño son válidas, pero de momento BP Studio no puede encontrar patrones de plegado que funcionen para ellas. El autor de esta aplicación seguirá implementando más algoritmos que permitan cubrir más casos.",
		"unsaved": ({normalize:n,interpolate:i,list:l})=>n(["El proyecto \"",i(l(0)),"\" contiene cambios sin guardar. ¿Descartar los cambios?"]),
		"updateReady": _=>"Una nueva versión de BP Studio está lista y se actualizará automáticamente al reiniciar. ¿Le gustaría reiniciar ahora?",
		"restartFail": _=>"No se puede reiniciar. Cierre todas las instancias de BP Studio.",
		"webGL": {
			"title": _=>"La inicialización de WebGL falló",
			"body": _=>"BP Studio requiere que se ejecute WebGL, pero no puede inicializar el contexto de WebGL. Por favor, compruebe la configuración de su navegador."
		},
		"inApp": _=>"Parece que estás utilizando un navegador integrado en la aplicación. Es posible que la descarga no funcione."
	},
	"plugin": {
		"TreeMaker": {
			"not5": ({normalize:n,interpolate:i,list:l})=>n(["El archivo \"",i(l(0)),"\" no tiene el formato TreeMaker 5."]),
			"size8": _=>"BP Studio requiere un tamaño de hoja de al menos 8.",
			"invalid": ({normalize:n,interpolate:i,list:l})=>n(["El archivo \"",i(l(0)),"\" parece dañado y no se puede cargar correctamente."])
		},
		"optimizer": {
			"_": _=>"Optimizar el diseño",
			"options": {
				"_": _=>"Opciones",
				"openNew": _=>"Mostrar resultado en una nueva pestaña",
				"useDim": _=>"Mantenga los anchos y altos de las solapas"
			},
			"layout": {
				"_": _=>"Método de diseño",
				"view": _=>"Utilice el diseño actual como referencia",
				"random": _=>"Pruebe diseños aleatorios y utilice el mejor",
				"toTry": _=>"Número de diseños para probar:",
				"useBH": _=>"Busque también soluciones cercanas"
			},
			"fit": {
				"_": _=>"Método de ajuste",
				"quick": _=>"modo rápido",
				"full": _=>"Modo completo"
			},
			"skip": _=>"Saltar",
			"run": _=>"¡Ejecuta!",
			"running": _=>"Ejecutando..."
		}
	},
	"keyword": {
		"yes": _=>"Sí",
		"no": _=>"No",
		"ok": _=>"OK",
		"here": _=>"aquí",
		"abort": _=>"Abortar",
		"close": _=>"Cerrar",
		"cancel": _=>"Cancelar",
		"export": _=>"Exportar",
		"delete": _=>"Borrar",
		"discord": _=>"Servidor Discord de BP Studio",
		"version": _=>"Versión",
		"filename": _=>"Nombre del archivo",
		"download": _=>"Descargar",
		"homepage": _=>"página principal",
		"untitled": _=>"Sin título",
		"errorLog": _=>"Descargar registro de errores",
		"workspace": _=>"espacio de trabajo"
	}
}
,
"ja": {
	"name": _=>"日本語",
	"flag": _=>"japan",
	"emoji": _=>"🇯🇵",
	"since": 0,
	"welcome": {
		"title": _=>"Box Pleating Studio へようこそ！",
		"intro": [
			_=>"このアプリは、折り紙のデザイナーが蛇腹折り（ボックスプリーツ）と GOPS ガジェットを使用して複雑でクレイジーなデザインを作成できるように作られています。",
			({normalize:n,interpolate:i,list:l})=>n(["まず、左上のメニューボタンをクリックして、空の新規プロジェクトを作成します。",i(l(0))," の簡単なユーザーマニュアルをお読みください（英語のみ）。"])
		],
		"install": {
			"hint": _=>"BP Studio をスタンドアロンアプリとしてデバイスにインストールし、オフラインで使用することもできます。",
			"ios": _=>"iOS にインストールする方法：Safari でこの Web サイトを開き、画面の下部にある[共有]アイコンをタップしてから、[ホーム画面に追加]をタップします。",
			"bt": _=>"Box Pleating Studio アプリをインストール",
			"prepare": _=>"インストールの準備をして、お待ちください...",
			"ing": _=>"アプリをインストールします、お待ちください...",
			"ed": _=>"BP Studio はすでにデバイスにインストールされています。",
			"open": _=>"Box Pleating Studio アプリを開く"
		},
		"copyright": ({normalize:n,interpolate:i,list:l})=>n(["Copyright © 2020",i(l(0))," 蔡 牧村"]),
		"recent": _=>"最近使用された",
		"start": _=>"開始",
		"website": _=>"BP Studio のウェブサイト",
		"discord": ({normalize:n,interpolate:i,list:l})=>n(["",i(l(0)),"に参加してください！"])
	},
	"toolbar": {
		"file": {
			"title": _=>"ファイル",
			"new": _=>"新規プロジェクト作成",
			"open": _=>"プロジェクト / ワークスペースを開く",
			"print": _=>"現在のビューを印刷",
			"share": _=>"現在のプロジェクトを共有",
			"notFound": ({normalize:n,interpolate:i,list:l})=>n(["ファイル \"",i(l(0)),"\" を開くことができません；ファイルが見つかりません。"]),
			"recent": {
				"title": _=>"最近のファイルを開く",
				"empty": _=>"記録なし",
				"clear": _=>"記録を削除する"
			},
			"BPF": _=>"BP Studio フォーマット",
			"BPS": {
				"name": _=>"BP Studio プロジェクト",
				"download": _=>"現在のプロジェクトをダウンロード",
				"save": _=>"プロジェクトを保存",
				"saveAs": _=>"プロジェクトを名前を付けて保存...",
				"saveAll": _=>"すべてのプロジェクトを保存する"
			},
			"BPZ": {
				"name": _=>"BP Studio ワークスペース",
				"download": _=>"ワークスペースをダウンロード",
				"save": _=>"ワークスペースを名前を付けて保存..."
			},
			"PNG": {
				"name": _=>"PNG 画像",
				"download": _=>"現在のビューを PNG としてダウンロード",
				"save": _=>"現在のビューを PNG として保存",
				"copy": _=>"現在のビューを PNG としてコピー"
			},
			"SVG": {
				"name": _=>"SV G画像",
				"download": _=>"現在のビューを SVG としてダウンロード",
				"save": _=>"現在のビューを SVG として保存"
			}
		},
		"edit": {
			"title": _=>"編集",
			"undo": _=>"元に戻す",
			"redo": _=>"やり直し",
			"selectAll": _=>"すべて選択",
			"unselectAll": _=>"すべて選択解除"
		},
		"setting": {
			"title": _=>"設定",
			"fullscreen": _=>"全画面表示",
			"fullscreenExit": _=>"全画面で終了",
			"grid": _=>"グリッド線を表示",
			"hinge": _=>"ヒンジ折り線を表示",
			"ridge": _=>"リッジ折り線を表示",
			"axial": _=>"ガジェットの軸平行折り線を表示",
			"label": _=>"ラベルを表示",
			"tip": _=>"カドの頂点を表示",
			"dPad": _=>"十字キーを表示",
			"status": _=>"ステータスバーを表示",
			"preference": _=>"環境設定"
		},
		"tools": {
			"title": _=>"ツール",
			"TreeMaker": _=>"TreeMaker ファイルをインポートする",
			"CP": {
				"_": _=>"CP ファイルのエクスポート",
				"reorient": _=>"該当する場合は、シートの向きを変更します"
			}
		},
		"help": {
			"title": _=>"ヘルプ",
			"about": _=>"ついて",
			"news": _=>"バージョン情報",
			"update": _=>"更新する準備ができました",
			"checkUpdate": _=>"更新を確認",
			"donation": _=>"寄付",
			"discussions": _=>"議論",
			"issue": _=>"問題を報告する",
			"homepage": _=>"ホームページ"
		},
		"view": {
			"tree": _=>"木構造",
			"layout": _=>"配置"
		},
		"tab": {
			"clone": _=>"クローン",
			"close": _=>"閉じる",
			"closeAll": _=>"すべて閉じる",
			"closeOther": _=>"他のタブを閉じる",
			"closeRight": _=>"右をすべて閉じる",
			"noTitle": _=>"(無題)"
		},
		"panel": _=>"オプションパネル"
	},
	"preference": {
		"general": _=>"一般",
		"color": {
			"_": _=>"色",
			"default": _=>"デフォルト",
			"border": _=>"境界線",
			"grid": _=>"グリッド線",
			"hinge": _=>"ヒンジ折り線",
			"ridge": _=>"リッジ折り線",
			"axisParallel": _=>"軸平行折り線",
			"overlap": _=>"オーバーラップ",
			"tip": _=>"カドの頂点",
			"label": _=>"テキストラベル"
		},
		"hotkey": _=>"ホットキー",
		"command": _=>"コマンド",
		"language": _=>"言語",
		"theme": {
			"_": _=>"テーマ",
			"dark": _=>"暗いテーマ",
			"light": _=>"明るいテーマ",
			"system": _=>"システム設定を使用する"
		},
		"reset": _=>"すべての設定をリセットします",
		"confirmReset": _=>"すべての設定をデフォルトにリセットしてもよろしいですか？",
		"confirmKey": ({normalize:n,interpolate:i,list:l})=>n(["ホットキー ",i(l(0))," はすでにコマンド「",i(l(1)),"」に割り当てられています。交換しますか？"]),
		"autoSave": _=>"ワークスペースを自動的に保存",
		"includeHidden": _=>"SVG エクスポートに非表示の要素を含める",
		"loadSessionOnQueue": _=>"プロジェクトファイルを直接開くときに前のセッションをロードする"
	},
	"panel": {
		"design": {
			"type": _=>"Box Pleating Studio プロジェクト",
			"title": _=>"題名",
			"titlePH": _=>"(プロジェクト名)",
			"descriptionPH": _=>"(プロジェクトの説明)",
			"tree": _=>"木構造ビュー",
			"layout": _=>"配置ビュー",
			"width": _=>"幅",
			"height": _=>"高さ",
			"size": _=>"サイズ",
			"zoom": _=>"ズーム",
			"grid": {
				"_": _=>"タイプ",
				"rect": _=>"矩形グリッド",
				"diag": _=>"対角線グリッド"
			}
		},
		"flap": {
			"type": _=>"カド",
			"name": _=>"名前",
			"radius": _=>"半径",
			"width": _=>"幅",
			"height": _=>"高さ",
			"goto": _=>"頂点に移動"
		},
		"flaps": {
			"type": _=>"カド",
			"goto": _=>"頂点に移動"
		},
		"river": {
			"type": _=>"帯領域",
			"width": _=>"幅",
			"goto": _=>"辺に移動"
		},
		"rivers": {
			"type": _=>"帯領域"
		},
		"vertex": {
			"type": _=>"頂点",
			"name": _=>"名前",
			"addLeaf": _=>"葉を追加",
			"ofLength": _=>"長さは",
			"delJoin": _=>"削除してからマージ",
			"goto": _=>"カドに移動"
		},
		"vertices": {
			"type": _=>"頂点",
			"goto": _=>"カドに移動"
		},
		"edge": {
			"type": _=>"辺",
			"length": _=>"長さ",
			"split": _=>"スプリット",
			"merge": _=>"端点をマージ",
			"goto": _=>"帯領域に移動"
		},
		"repo": {
			"type": _=>"ストレッチ",
			"config": _=>"構成",
			"pattern": _=>"パターン",
			"onlyOne": _=>"パターンが 1 つだけ見つかりました。"
		}
	},
	"status": {
		"invalid": _=>"無効なオーバーラップ"
	},
	"share": {
		"title": _=>"プロジェクトを共有する",
		"copy": _=>"コピー",
		"share": _=>"シェア",
		"message": ({normalize:n,interpolate:i,list:l})=>n(["Box Pleating Studio で設計された私のプロジェクト \"",i(l(0)),"\" をチェックしてください！"])
	},
	"about": {
		"title": _=>"Box Pleating Studio について",
		"license": _=>"MIT ライセンスの下でリリースされました。",
		"manual": ({normalize:n,interpolate:i,list:l})=>n(["ユーザーマニュアルについては、アプリの s",i(l(0)),"にアクセスしてください。"]),
		"feedback": ({normalize:n,interpolate:i,list:l})=>n(["フィードバックについては、アプリの",i(l(0)),"にアクセスしてください。"]),
		"repo": _=>"Github リポジトリ",
		"donation": ({normalize:n,interpolate:i,list:l})=>n(["BP Studio は完全に無料で使用できます。このアプリがデザインに役立ち、このアプリのサポートに関心がある場合は、",i(l(0))," を使用して任意の金額を寄付できます。"]),
		"visitBlog": ({normalize:n,interpolate:i,list:l})=>n(["詳細については、著者の",i(l(0)),"にもアクセスしてください！"]),
		"blog": _=>"ブログ",
		"sponsor": _=>"BP Studio は誇りを持って以下のスポンサーからの支援を受けています："
	},
	"donate": {
		"title": _=>"Box Pleating Studio のサポート",
		"intro": _=>"Box Pleating Studio のサポートをご検討いただき、ありがとうございます。寄付したい金額を入力してください。コーヒーを 1 ドルで、ディナーを 10 ドルで購入できます。😄（PayPal の手数料はチェックアウト時に追加されます）",
		"error": _=>"金額を入力してください",
		"then": _=>"次に、下のボタンをクリックし、指示に従って完了します。",
		"wait": _=>"PayPal が取引を完了するまでお待ちください...",
		"nextTime": _=>"また今度",
		"thank": ({normalize:n,interpolate:i,list:l})=>n(["",i(l(0)),"さん、ご寄付ありがとうございます！"])
	},
	"message": {
		"connFail": _=>"インターネット接続に失敗しました。後でもう一度やり直してください。",
		"downloadHint": _=>"右クリックして[名前を付けて保存]を使用し、ファイルの場所を選択します。",
		"filePermission": _=>"セキュリティ上の理由から、BP Studio にはファイルにアクセスするための許可が必要です。ファイルごとに、セッションごとに1回だけアクセス許可を付与する必要があります。それでもファイルにアクセスしますか？",
		"fatal": _=>"内部エラーが発生したため、プロジェクトをこれ以上操作できません。",
		"recover": _=>"ワークスペースは自動的に回復されますが、エラーは継続する可能性があります。問題を診断するために、エラー ログをダウンロードして作成者に送信してください。",
		"recoverFailed": _=>"回復に失敗しました。",
		"invalidFormat": ({normalize:n,interpolate:i,list:l})=>n(["ファイル \"",i(l(0)),"\" の形式が無効です。"]),
		"invalidLink": _=>"プロジェクトリンクを開くときに予期しないエラーが発生しました。\nデータが破損している可能性があります。",
		"latest": _=>"BP Studio の最新バージョンはすでにお持ちです。",
		"min3vertex": _=>"木には少なくとも 3 つの頂点が必要です。",
		"oldVersion": ({normalize:n,interpolate:i,list:l})=>n(["プロジェクト \"",i(l(0)),"\" は古いバージョンの BP Studio で作成されており、一部のストレッチパターンを再選択する必要がある場合があります。次回の保存時に最新のフォーマットに更新されます。"]),
		"patternNotFound": _=>"このデザインのフラップの重なりの一部は有効ですが、現時点では BP Studio はそれらの重なりの機能するストレッチパターンを見つけることができません。このアプリの作成者は、より多くのケースをカバーするために、より多くのアルゴリズムを実装し続けます。",
		"unsaved": ({normalize:n,interpolate:i,list:l})=>n(["プロジェクト \"",i(l(0)),"\" には、保存されていない変更が含まれています。変更を破棄しますか？"]),
		"updateReady": _=>"新しいバージョンの BP Studio の準備ができており、再起動時に自動的に更新されます。今すぐ再起動しますか？",
		"restartFail": _=>"再起動できません。BP Studio のすべてのインスタンスを閉じてください。",
		"webGL": {
			"title": _=>"WebGL の初期化に失敗しました",
			"body": _=>"BP Studio を実行するには WebGL が必要ですが、WebGL コンテキストを初期化できません。ブラウザの設定を確認してください。"
		},
		"inApp": _=>"アプリ内ブラウザを使用しているようです。ダウンロードが機能しない可能性があります。"
	},
	"plugin": {
		"TreeMaker": {
			"not5": ({normalize:n,interpolate:i,list:l})=>n(["ファイル \"",i(l(0)),"\" は TreeMaker 5 形式ではありません。"]),
			"size8": _=>"BP Studio には、少なくとも 8 枚のシートサイズが必要です。",
			"invalid": ({normalize:n,interpolate:i,list:l})=>n(["ファイル \"",i(l(0)),"\" が破損しているようで、正常にロードできません。"])
		},
		"optimizer": {
			"_": _=>"レイアウトの最適化",
			"options": {
				"_": _=>"オプション",
				"openNew": _=>"新しいタブに結果を表示",
				"useDim": _=>"カドの幅と高さを維持する"
			},
			"layout": {
				"_": _=>"レイアウト方法",
				"view": _=>"現在のレイアウトを参考として使用してください",
				"random": _=>"ランダムなレイアウトを試して、最適なものを使用してください",
				"toTry": _=>"試行するレイアウトの数:",
				"useBH": _=>"近くのソリューションも検索します"
			},
			"fit": {
				"_": _=>"はめ込み方法",
				"quick": _=>"クイックモード",
				"full": _=>"フルモード"
			},
			"skip": _=>"スキップ",
			"run": _=>"実行して！",
			"running": _=>"実行中..."
		}
	},
	"keyword": {
		"yes": _=>"はい",
		"no": _=>"いいえ",
		"ok": _=>"OK",
		"here": _=>"こちら",
		"abort": _=>"アボート",
		"close": _=>"閉じる",
		"cancel": _=>"キャンセル",
		"export": _=>"エクスポート",
		"delete": _=>"削除",
		"discord": _=>"BP Studio Discord サーバー",
		"version": _=>"バージョン",
		"filename": _=>"ファイル名",
		"download": _=>"ダウンロード",
		"homepage": _=>"ホームページ",
		"untitled": _=>"無題",
		"errorLog": _=>"ダウンロードエラーログ",
		"workspace": _=>"ワークスペース"
	}
}
,
"ko": {
	"name": _=>"한국어",
	"flag": _=>"s_korea",
	"emoji": _=>"🇰🇷",
	"since": 1187,
	"welcome": {
		"title": _=>"Box Pleating Studio 에 오신 것을 환영합니다!",
		"intro": [
			_=>"이 응용 프로그램은 종이 접기 디자이너가 박스 플릿과 GOPS 장치를 사용하여 복잡하고 미친 디자인을 만들 수 있도록 만들어졌습니다.",
			({normalize:n,interpolate:i,list:l})=>n(["시작하려면 왼쪽 상단 메뉴 버튼을 클릭하여 비어 있는 새 프로젝트를 생성하거나 ",i(l(0))," 에 대한 간략한 사용 설명서(영어로만 제공)를 읽으십시오."])
		],
		"install": {
			"hint": _=>"BP Studio 를 독립 실행형 앱으로 장치에 설치하고 오프라인에서 사용할 수도 있습니다!",
			"ios": _=>"iOS 에 설치하는 방법: Safari 에서 이 웹사이트를 열고 화면 하단의 \"공유\" 아이콘을 누른 다음 \"홈 화면에 추가\" 를 누릅니다.",
			"bt": _=>"Box Pleating Studio 앱 설치",
			"prepare": _=>"설치를 준비 중입니다. 잠시만 기다려 주십시오...",
			"ing": _=>"앱을 설치하는 중입니다. 잠시만 기다려 주십시오...",
			"ed": _=>"BP Studio 는 이미 장치에 설치되어 있습니다.",
			"open": _=>"Box Pleating Studio 앱 열기"
		},
		"copyright": ({normalize:n,interpolate:i,list:l})=>n(["Copyright © 2020",i(l(0))," by Mu-Tsun Tsai"]),
		"recent": _=>"최근 사용",
		"start": _=>"시작",
		"website": _=>"BP Studio 웹사이트",
		"discord": ({normalize:n,interpolate:i,list:l})=>n(["",i(l(0))," 에 가입하세요!"])
	},
	"toolbar": {
		"file": {
			"title": _=>"파일",
			"new": _=>"새로운 프로젝트",
			"open": _=>"프로젝트/작업 공간 열기",
			"print": _=>"현재 보기 인쇄",
			"share": _=>"현재 프로젝트 공유",
			"notFound": ({normalize:n,interpolate:i,list:l})=>n(["\"",i(l(0)),"\" 파일을 열 수 없습니다. 파일을 찾을 수 없습니다."]),
			"recent": {
				"title": _=>"최근 파일 열기",
				"empty": _=>"기록 없음",
				"clear": _=>"기록 지우기"
			},
			"BPF": _=>"BP Studio 형식",
			"BPS": {
				"name": _=>"BP Studio 프로젝트",
				"download": _=>"현재 프로젝트 다운로드",
				"save": _=>"프로젝트를 저장",
				"saveAs": _=>"프로젝트를 다른 이름으로 저장...",
				"saveAll": _=>"모든 프로젝트 저장"
			},
			"BPZ": {
				"name": _=>"BP Studio 작업 공간",
				"download": _=>"작업 공간 다운로드",
				"save": _=>"작업공간을 다른 이름으로 저장..."
			},
			"PNG": {
				"name": _=>"PNG 이미지",
				"download": _=>"현재 보기를 PNG 로 다운로드",
				"save": _=>"현재 보기를 PNG 로 저장",
				"copy": _=>"현재 보기를 PNG 로 복사"
			},
			"SVG": {
				"name": _=>"SVG 이미지",
				"download": _=>"현재 보기를 SVG 로 다운로드",
				"save": _=>"현재 보기를 SVG 로 저장"
			}
		},
		"edit": {
			"title": _=>"편집",
			"undo": _=>"실행 취소",
			"redo": _=>"다시 하기",
			"selectAll": _=>"모두 선택",
			"unselectAll": _=>"모두 선택 해제"
		},
		"setting": {
			"title": _=>"설정",
			"fullscreen": _=>"전체화면",
			"fullscreenExit": _=>"전체화면 종료",
			"grid": _=>"격자선 표시",
			"hinge": _=>"경첩 주름 표시",
			"ridge": _=>"능선 주름 표시",
			"axial": _=>"가젯에 축 평행 주름 표시",
			"label": _=>"라벨 표시",
			"tip": _=>"가지 팁 표시",
			"dPad": _=>"방향 패드 표시",
			"status": _=>"상태 표시줄 표시",
			"preference": _=>"기본 설정"
		},
		"tools": {
			"title": _=>"도구",
			"TreeMaker": _=>"TreeMaker 파일 가져오기",
			"CP": {
				"_": _=>"CP 파일 내보내기",
				"reorient": _=>"해당하는 경우 시트 방향 변경"
			}
		},
		"help": {
			"title": _=>"도움",
			"about": _=>"정보",
			"news": _=>"버전 정보",
			"update": _=>"업데이트 준비 완료",
			"checkUpdate": _=>"업데이트를 확인",
			"donation": _=>"기부",
			"discussions": _=>"토론",
			"issue": _=>"문제 신고",
			"homepage": _=>"홈페이지"
		},
		"view": {
			"tree": _=>"트리 구조",
			"layout": _=>"레이아웃"
		},
		"tab": {
			"clone": _=>"복제",
			"close": _=>"닫기",
			"closeAll": _=>"모두 닫기",
			"closeOther": _=>"다른 탭 모두 닫기",
			"closeRight": _=>"오른쪽 모두 닫기",
			"noTitle": _=>"(제목 없음)"
		},
		"panel": _=>"옵션 패널"
	},
	"preference": {
		"general": _=>"일반적인",
		"color": {
			"_": _=>"그림 물감",
			"default": _=>"기본",
			"border": _=>"경계선",
			"grid": _=>"격자선",
			"hinge": _=>"경첩 주름",
			"ridge": _=>"능선 주름",
			"axisParallel": _=>"축 평행 주름",
			"overlap": _=>"겹치는",
			"tip": _=>"가지 팁",
			"label": _=>"텍스트 라벨"
		},
		"hotkey": _=>"단축키",
		"command": _=>"명령",
		"language": _=>"언어",
		"theme": {
			"_": _=>"주제",
			"dark": _=>"어두운 테마",
			"light": _=>"밝은 테마",
			"system": _=>"시스템 설정 사용"
		},
		"reset": _=>"모든 설정을 기본값으로 재설정",
		"confirmReset": _=>"모든 설정을 기본값으로 재설정하시겠습니까?",
		"confirmKey": ({normalize:n,interpolate:i,list:l})=>n(["단축키 ",i(l(0))," 은(는) 이미 \"",i(l(1)),"\" 명령에 할당되었습니다. 교체하시겠습니까?"]),
		"autoSave": _=>"자동으로 작업 공간 저장",
		"includeHidden": _=>"SVG 내보내기에 숨겨진 요소 포함",
		"loadSessionOnQueue": _=>"프로젝트 파일을 직접 열 때 이전 세션 로드"
	},
	"panel": {
		"design": {
			"type": _=>"Box Pleating Studio 프로젝트",
			"title": _=>"제목",
			"titlePH": _=>"(프로젝트 제목)",
			"descriptionPH": _=>"(프로젝트 설명)",
			"tree": _=>"트리 구조 보기",
			"layout": _=>"레이아웃 보기",
			"width": _=>"너비",
			"height": _=>"높이",
			"size": _=>"크기",
			"zoom": _=>"줌",
			"grid": {
				"_": _=>"유형",
				"rect": _=>"직사각형 그리드",
				"diag": _=>"대각선 그리드"
			}
		},
		"flap": {
			"type": _=>"가지",
			"name": _=>"이름",
			"radius": _=>"반지름",
			"width": _=>"너비",
			"height": _=>"높이",
			"goto": _=>"꼭짓점으로 이동"
		},
		"flaps": {
			"type": _=>"가지",
			"goto": _=>"꼭짓점으로 이동"
		},
		"river": {
			"type": _=>"리버",
			"width": _=>"너비",
			"goto": _=>"가장자리로 이동"
		},
		"rivers": {
			"type": _=>"리버"
		},
		"vertex": {
			"type": _=>"꼭짓점",
			"name": _=>"이름",
			"addLeaf": _=>"잎 추가",
			"ofLength": _=>"길이의",
			"delJoin": _=>"삭제 및 연결",
			"goto": _=>"가지으로 이동"
		},
		"vertices": {
			"type": _=>"꼭짓점",
			"goto": _=>"가지으로 이동"
		},
		"edge": {
			"type": _=>"가장자리",
			"length": _=>"길이",
			"split": _=>"나누기",
			"merge": _=>"끝 꼭짓점 병합",
			"goto": _=>"리버로 이동"
		},
		"repo": {
			"type": _=>"스트레치",
			"config": _=>"구성",
			"pattern": _=>"패턴",
			"onlyOne": _=>"하나의 패턴만 발견됩니다."
		}
	},
	"status": {
		"invalid": _=>"잘못된 겹침"
	},
	"share": {
		"title": _=>"프로젝트 공유",
		"copy": _=>"복사",
		"share": _=>"공유",
		"message": ({normalize:n,interpolate:i,list:l})=>n(["Box Pleating Studio 로 디자인한 내 프로젝트 \"",i(l(0)),"\" 를 확인하세요!"])
	},
	"about": {
		"title": _=>"Box Pleating Studio 에 대하여",
		"license": _=>"MIT 라이선스에 따라 출시되었습니다.",
		"manual": ({normalize:n,interpolate:i,list:l})=>n(["사용 설명서는 앱의 ",i(l(0))," 를 방문하십시오."]),
		"feedback": ({normalize:n,interpolate:i,list:l})=>n(["피드백이 필요하면 앱의 ",i(l(0))," 를 방문하세요."]),
		"repo": _=>"Github 저장소",
		"donation": ({normalize:n,interpolate:i,list:l})=>n(["BP Studio 는 완전 무료입니다. 이 앱이 디자인에 도움이 되었다고 생각하고 이 앱을 지원하는 데 관심이 있다면 ",i(l(0))," 에 얼마든지 기부할 수 있습니다."]),
		"visitBlog": ({normalize:n,interpolate:i,list:l})=>n(["자세한 내용은 작성자의 ",i(l(0))," 도 참조하세요!"]),
		"blog": _=>"블로그",
		"sponsor": _=>"BP Studio 는 자랑스럽게 다음과 같은 후원을 받고 있습니다:"
	},
	"donate": {
		"title": _=>"Box Pleating Studio 지원",
		"intro": _=>"Box Pleating Studio 지원을 고려해주셔서 감사합니다! 기부하고 싶은 금액을 입력하세요. 커피는 1달러로, 저녁은 10달러로 살 수 있습니다. 😄 (PayPal 수수료는 체크아웃 시 추가됩니다.)",
		"error": _=>"번호를 입력하세요",
		"then": _=>"그런 다음 아래 버튼을 클릭하고 지침에 따라 완료해주세요.",
		"wait": _=>"PayPal 이 거래를 완료할 때까지 기다려주세요...",
		"nextTime": _=>"다음 기회에",
		"thank": ({normalize:n,interpolate:i,list:l})=>n(["",i(l(0))," 님, 친절한 기부에 정말 감사드립니다!"])
	},
	"message": {
		"connFail": _=>"인터넷 연결에 실패했습니다. 나중에 다시 시도해주세요.",
		"downloadHint": _=>"마우스 오른쪽 버튼을 클릭하고 \"다른 이름으로 저장\" 을 사용하여 파일 위치를 선택합니다.",
		"filePermission": _=>"보안상의 이유로 BP Studio 는 파일에 액세스할 수 있는 권한이 필요합니다. 각 파일에 대해 세션당 한 번만 권한을 부여하면 됩니다. 파일에 계속 액세스하시겠습니까?",
		"fatal": _=>"내부 오류가 발생하여 프로젝트를 더 이상 실행할 수 없습니다.",
		"recover": _=>"작업공간은 자동으로 복구되지만 오류는 지속될 가능성이 높습니다. \n문제 진단을 위해 오류 로그를 다운로드하여 작성자에게 보내십시오.",
		"recoverFailed": _=>"복구에 실패했습니다.",
		"invalidFormat": ({normalize:n,interpolate:i,list:l})=>n(["파일 \"",i(l(0)),"\" 의 형식이 잘못되었습니다."]),
		"invalidLink": _=>"프로젝트 링크를 열 때 예기치 않은 오류가 발생했습니다. 데이터가 손상되었을 수 있습니다.",
		"latest": _=>"이미 최신 버전의 BP Studio 가 있습니다.",
		"min3vertex": _=>"트리에는 최소한 3개의 꼭짓점이 있어야 합니다.",
		"oldVersion": ({normalize:n,interpolate:i,list:l})=>n(["프로젝트 \"",i(l(0)),"\" 은 이전 버전의 BP Studio 로 생성되었으며 일부 스트레치 패턴을 다시 선택해야 할 수 있습니다. 다음 저장 시 최신 형식으로 업데이트됩니다."]),
		"patternNotFound": _=>"이 디자인에서 가지의 겹침 중 일부는 유효하지만 현재 BP Studio 는 작동하는 스트레치 패턴을 찾을 수 없습니다. 이 앱의 작성자는 더 많은 사례를 다루기 위해 더 많은 알고리즘을 계속 구현할 것입니다.",
		"unsaved": ({normalize:n,interpolate:i,list:l})=>n(["프로젝트 \"",i(l(0)),"\" 에 저장되지 않은 변경 사항이 있습니다. 변경사항을 취소하시겠습니까?"]),
		"updateReady": _=>"최신 버전의 BP Studio 가 준비되었으며 다시 시작할 때 자동으로 업데이트됩니다. 지금 다시 시작하시겠습니까?",
		"restartFail": _=>"다시 시작할 수 없습니다. BP Studio 의 모든 인스턴스를 닫으십시오.",
		"webGL": {
			"title": _=>"WebGL 초기화 실패",
			"body": _=>"BP Studio 를 실행하려면 WebGL이 필요하지만 WebGL 컨텍스트를 초기화할 수 없습니다. 브라우저의 설정을 확인하십시오."
		},
		"inApp": _=>"인앱 브라우저를 사용하고 있는 것 같습니다. 다운로드가 작동하지 않을 수 있습니다."
	},
	"plugin": {
		"TreeMaker": {
			"not5": ({normalize:n,interpolate:i,list:l})=>n(["파일 \"",i(l(0)),"\" 은 TreeMaker 5 형식이 아닙니다."]),
			"size8": _=>"BP Studio 는 시트 크기가 적어도 8 이상이어야 합니다.",
			"invalid": ({normalize:n,interpolate:i,list:l})=>n(["파일 \"",i(l(0)),"\" 이 손상되어 성공적으로 로드할 수 없습니다."])
		},
		"optimizer": {
			"_": _=>"레이아웃 최적화",
			"options": {
				"_": _=>"옵션",
				"openNew": _=>"새 탭에 결과 표시",
				"useDim": _=>"가지의 너비와 높이를 유지하십시오"
			},
			"layout": {
				"_": _=>"레이아웃 방법",
				"view": _=>"현재 레이아웃을 참조로 사용합니다",
				"random": _=>"임의의 레이아웃을 시도하고 가장 좋은 레이아웃을 사용하십시오",
				"toTry": _=>"시도할 레이아웃 수:",
				"useBH": _=>"주변 솔루션도 검색해 보세요"
			},
			"fit": {
				"_": _=>"피팅 방법",
				"quick": _=>"빠른 모드",
				"full": _=>"전체 모드"
			},
			"skip": _=>"건너뛰다",
			"run": _=>"실행해!",
			"running": _=>"실행 중..."
		}
	},
	"keyword": {
		"yes": _=>"예",
		"no": _=>"아니요",
		"ok": _=>"좋아요",
		"here": _=>"여기",
		"abort": _=>"중단",
		"close": _=>"닫기",
		"cancel": _=>"취소",
		"export": _=>"내보내기",
		"delete": _=>"삭제",
		"discord": _=>"BP Studio 디스코드 서버",
		"version": _=>"버전",
		"filename": _=>"파일 이름",
		"download": _=>"다운로드",
		"homepage": _=>"홈페이지",
		"untitled": _=>"무제",
		"errorLog": _=>"오류 로그 다운로드",
		"workspace": _=>"작업 공간"
	}
}
,
"vi": {
	"name": _=>"Tiếng Việt",
	"flag": _=>"vietnam",
	"emoji": _=>"🇻🇳",
	"since": 935,
	"welcome": {
		"title": _=>"Chào mừng bạn đến với Box Pleating Studio!",
		"intro": [
			_=>"Ứng dụng này được tạo ra để giúp các nhà thiết kế origami tạo ra các thiết kế phức tạp, điên rồ bằng cách sử dụng các box pleating và tiện ích GOPS.",
			({normalize:n,interpolate:i,list:l})=>n(["Để bắt đầu, hãy nhấp vào nút menu phía trên bên trái để tạo một dự án mới trống hoặc đọc hướng dẫn sử dụng ngắn gọn của chúng tôi về ",i(l(0))," (chỉ bằng tiếng Anh)."])
		],
		"install": {
			"hint": _=>"Bạn cũng có thể cài đặt BP Studio như một ứng dụng độc lập cho thiết bị của mình và sử dụng ngoại tuyến!",
			"ios": _=>"Cách cài đặt trên iOS: Mở trang web này trong Safari, chạm vào biểu tượng \"Chia sẻ\" ở cuối màn hình, sau đó chạm vào \"Thêm vào màn hình chính\".",
			"bt": _=>"Cài đặt ứng dụng Box Pleating Studio",
			"prepare": _=>"Đang chuẩn bị cài đặt, vui lòng đợi ...",
			"ing": _=>"Đang cài đặt ứng dụng, vui lòng đợi ...",
			"ed": _=>"BP Studio đã được cài đặt trên thiết bị của bạn.",
			"open": _=>"Mở ứng dụng Studio Pleating Box"
		},
		"copyright": ({normalize:n,interpolate:i,list:l})=>n(["Bản quyền © 2020",i(l(0))," bởi Thái Mục Thôn (Mu-Tsun Tsai)"]),
		"recent": _=>"Được sử dụng gần đây",
		"start": _=>"Khởi đầu",
		"website": _=>"Trang web BP Studio",
		"discord": ({normalize:n,interpolate:i,list:l})=>n(["Hãy tham gia ",i(l(0))," của chúng tôi!"])
	},
	"toolbar": {
		"file": {
			"title": _=>"Các tập tin",
			"new": _=>"Dự án mới",
			"open": _=>"Mở các dự án / không gian làm việc",
			"print": _=>"In chế độ xem hiện tại",
			"share": _=>"Chia sẻ dự án hiện tại",
			"notFound": ({normalize:n,interpolate:i,list:l})=>n(["Không thể mở tệp \"",i(l(0)),"\"; \nkhông tìm thấy tệp."]),
			"recent": {
				"title": _=>"Mở tệp gần đây",
				"empty": _=>"Không có hồ sơ",
				"clear": _=>"Xóa hồ sơ"
			},
			"BPF": _=>"Định dạng BP Studio",
			"BPS": {
				"name": _=>"Dự án BP Studio",
				"download": _=>"Tải xuống dự án hiện tại",
				"save": _=>"Lưu dự án",
				"saveAs": _=>"Lưu dự án thành ...",
				"saveAll": _=>"Lưu tất cả các dự án"
			},
			"BPZ": {
				"name": _=>"Không gian làm việc của BP Studio",
				"download": _=>"Tải xuống không gian làm việc",
				"save": _=>"Lưu không gian làm việc thành ..."
			},
			"PNG": {
				"name": _=>"Hình ảnh PNG",
				"download": _=>"Tải xuống chế độ xem hiện tại dưới dạng PNG",
				"save": _=>"Lưu chế độ xem hiện tại dưới dạng PNG",
				"copy": _=>"Sao chép chế độ xem hiện tại dưới dạng PNG"
			},
			"SVG": {
				"name": _=>"SVG hình ảnh",
				"download": _=>"Tải xuống chế độ xem hiện tại dưới dạng SVG",
				"save": _=>"Lưu chế độ xem hiện tại dưới dạng SVG"
			}
		},
		"edit": {
			"title": _=>"Biên tập",
			"undo": _=>"Hoàn tác",
			"redo": _=>"Làm lại",
			"selectAll": _=>"Chọn tất cả",
			"unselectAll": _=>"Bỏ chọn tất cả"
		},
		"setting": {
			"title": _=>"Thiết lập",
			"fullscreen": _=>"Toàn màn hình",
			"fullscreenExit": _=>"Thoát toàn màn hình",
			"grid": _=>"Hiện đường lưới",
			"hinge": _=>"Hiện nếp gấp bản lề",
			"ridge": _=>"Hiện nếp gấp ở sườn",
			"axial": _=>"Hiện nếp gấp trục song song trong tiện ích",
			"label": _=>"Hiện nhãn",
			"tip": _=>"Hiện mẹo nhánh",
			"dPad": _=>"Hiện D-pad",
			"status": _=>"Thanh trạng thái chương trình",
			"preference": _=>"Tùy chọn"
		},
		"tools": {
			"title": _=>"Công cụ",
			"TreeMaker": _=>"Nhập tệp TreeMaker",
			"CP": {
				"_": _=>"Xuất tệp CP",
				"reorient": _=>"Định hướng lại trang tính nếu có"
			}
		},
		"help": {
			"title": _=>"Cứu giúp",
			"about": _=>"Trong khoảng",
			"news": _=>"Thông tin phiên bản",
			"update": _=>"Sẵn sàng cập nhật",
			"checkUpdate": _=>"Kiểm tra cập nhật",
			"donation": _=>"Quyên góp",
			"discussions": _=>"Thảo luận",
			"issue": _=>"Báo cáo phát hành",
			"homepage": _=>"Trang chủ"
		},
		"view": {
			"tree": _=>"Cấu trúc cây",
			"layout": _=>"Bố trí"
		},
		"tab": {
			"clone": _=>"Nhân bản",
			"close": _=>"Đóng",
			"closeAll": _=>"Đóng tất cả",
			"closeOther": _=>"Đóng những cái khác",
			"closeRight": _=>"Đóng tất cả sang bên phải",
			"noTitle": _=>"(Không tiêu đề)"
		},
		"panel": _=>"Bảng tùy chọn"
	},
	"preference": {
		"general": _=>"Tổng quan",
		"color": {
			"_": _=>"Màu sắc",
			"default": _=>"Mặc định",
			"border": _=>"Đường biên giới",
			"grid": _=>"Đường lưới",
			"hinge": _=>"Nếp gấp bản lề",
			"ridge": _=>"Nếp gấp ở sườn",
			"axisParallel": _=>"Nếp gấp trục song song",
			"overlap": _=>"Qua nối chồng",
			"tip": _=>"Mẹo nhánh",
			"label": _=>"Nhãn văn bản"
		},
		"hotkey": _=>"Phím nóng",
		"command": _=>"Chỉ huy",
		"language": _=>"Ngôn ngữ",
		"theme": {
			"_": _=>"Chủ đề",
			"dark": _=>"Chủ đề tối",
			"light": _=>"Chủ đề sáng",
			"system": _=>"Sử dụng cài đặt hệ thống"
		},
		"reset": _=>"Đặt lại tất cả cài đặt về mặc định",
		"confirmReset": _=>"Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định không?",
		"confirmKey": ({normalize:n,interpolate:i,list:l})=>n(["Phím nóng ",i(l(0))," đã được gán cho lệnh \"",i(l(1)),"\"; bạn có muốn thay thế nó không?"]),
		"autoSave": _=>"Tự động lưu không gian làm việc",
		"includeHidden": _=>"Bao gồm các yếu tố ẩn trong xuất SVG",
		"loadSessionOnQueue": _=>"Tải phiên trước khi mở trực tiếp tệp dự án"
	},
	"panel": {
		"design": {
			"type": _=>"Box Pleating Studio Project",
			"title": _=>"Tiêu đề",
			"titlePH": _=>"(Tên dự án)",
			"descriptionPH": _=>"(Mô tả dự án)",
			"tree": _=>"Chế độ xem cấu trúc cây",
			"layout": _=>"Chế độ xem bố cục",
			"width": _=>"Chiều rộng",
			"height": _=>"Chiều cao",
			"size": _=>"Kích thước",
			"zoom": _=>"Thu phóng",
			"grid": {
				"_": _=>"Loại",
				"rect": _=>"Lưới hình chữ nhật",
				"diag": _=>"Lưới đường chéo"
			}
		},
		"flap": {
			"type": _=>"Nhánh",
			"name": _=>"Tên",
			"radius": _=>"Bán kính",
			"width": _=>"Chiều rộng",
			"height": _=>"Chiều cao",
			"goto": _=>"Đi tới đỉnh"
		},
		"flaps": {
			"type": _=>"Nhánh",
			"goto": _=>"Đi tới đỉnh"
		},
		"river": {
			"type": _=>"Sông",
			"width": _=>"Chiều rộng",
			"goto": _=>"Đi tới cạnh"
		},
		"rivers": {
			"type": _=>"Sông"
		},
		"vertex": {
			"type": _=>"Đỉnh",
			"name": _=>"Tên",
			"addLeaf": _=>"Thêm lá",
			"ofLength": _=>"chiều dài",
			"delJoin": _=>"Xóa và đến",
			"goto": _=>"Đi tới nhánh"
		},
		"vertices": {
			"type": _=>"Đỉnh",
			"goto": _=>"Đi tới nhánh"
		},
		"edge": {
			"type": _=>"Cạnh",
			"length": _=>"Chiều dài",
			"split": _=>"Tách ra",
			"merge": _=>"Hợp nhất các đỉnh cuối",
			"goto": _=>"Đi tới sông"
		},
		"repo": {
			"type": _=>"Căng ra",
			"config": _=>"Cấu hình",
			"pattern": _=>"Mẫu",
			"onlyOne": _=>"Chỉ có một mẫu được tìm thấy."
		}
	},
	"status": {
		"invalid": _=>"chồng chéo không hợp lệ"
	},
	"share": {
		"title": _=>"Chia sẻ dự án",
		"copy": _=>"Sao chép",
		"share": _=>"Chia sẻ",
		"message": ({normalize:n,interpolate:i,list:l})=>n(["Xem dự án của tôi \"",i(l(0)),"\" được thiết kế với Box Pleating Studio!"])
	},
	"about": {
		"title": _=>"Giới thiệu về Box Pleating Studio",
		"license": _=>"Được phát hành theo giấy phép MIT.",
		"manual": ({normalize:n,interpolate:i,list:l})=>n(["Để biết hướng dẫn sử dụng, hãy truy cập ",i(l(0))," của ứng dụng."]),
		"feedback": ({normalize:n,interpolate:i,list:l})=>n(["Để có phản hồi, hãy truy cập ",i(l(0))," của ứng dụng."]),
		"repo": _=>"Kho lưu trữ Github",
		"donation": ({normalize:n,interpolate:i,list:l})=>n(["BP Studio hoàn toàn miễn phí để sử dụng. Nếu bạn thấy ứng dụng này hữu ích cho thiết kế của mình và quan tâm đến việc hỗ trợ ứng dụng này, bạn có thể quyên góp bất kỳ số tiền nào với ",i(l(0)),"."]),
		"visitBlog": ({normalize:n,interpolate:i,list:l})=>n(["Cũng truy cập ",i(l(0))," của tác giả để biết thêm thông tin!"]),
		"blog": _=>"Blog",
		"sponsor": _=>"BP Studio tự hào được tài trợ bởi:"
	},
	"donate": {
		"title": _=>"Hỗ trợ Box Pleating Studio",
		"intro": _=>"Cảm ơn bạn đã xem xét ủng hộ Box Pleating Studio! Vui lòng nhập bất kỳ số tiền nào bạn muốn đóng góp. Bạn có thể mua cho tôi một ly cà phê với $ 1, hoặc một bữa tối với $ 10, v.v. 😄 (Phí xử lý PayPal sẽ được thêm vào khi thanh toán)",
		"error": _=>"Vui lòng nhập một số",
		"then": _=>"Sau đó bấm vào nút bên dưới và làm theo hướng dẫn để hoàn thành.",
		"wait": _=>"Vui lòng đợi cho đến khi PayPal hoàn tất giao dịch của bạn ...",
		"nextTime": _=>"Có lẽ lần sau",
		"thank": ({normalize:n,interpolate:i,list:l})=>n(["Cảm ơn bạn rất nhiều, ",i(l(0)),", vì sự đóng góp tử tế của bạn!"])
	},
	"message": {
		"connFail": _=>"Kết nối Internet không thành công; vui lòng thử lại sau.",
		"downloadHint": _=>"Nhấp chuột phải và sử dụng \"Save As\" để chọn vị trí tệp.",
		"filePermission": _=>"Vì lý do bảo mật, BP Studio cần sự cho phép của bạn để truy cập tệp. Đối với mỗi tệp, bạn sẽ chỉ cần cấp quyền một lần cho mỗi phiên. Bạn vẫn muốn truy cập tệp?",
		"fatal": _=>"Đã xảy ra lỗi nội bộ và dự án không thể tiếp tục được vận hành.",
		"recover": _=>"Không gian làm việc sẽ được khôi phục tự động nhưng lỗi có thể vẫn tồn tại. \nVui lòng tải xuống nhật ký lỗi và gửi cho tác giả để chẩn đoán sự cố.",
		"recoverFailed": _=>"Khôi phục không thành công.",
		"invalidFormat": ({normalize:n,interpolate:i,list:l})=>n(["Tệp \"",i(l(0)),"\" có định dạng không hợp lệ."]),
		"invalidLink": _=>"Đã xảy ra lỗi không mong muốn khi mở liên kết dự án; \ndữ liệu có thể bị hỏng.",
		"latest": _=>"Bạn đã có phiên bản BP Studio mới nhất.",
		"min3vertex": _=>"Cây cần có ít nhất 3 đỉnh.",
		"oldVersion": ({normalize:n,interpolate:i,list:l})=>n(["Dự án \"",i(l(0)),"\" đã được tạo bằng phiên bản cũ hơn của BP Studio và một số mẫu căng có thể cần được chọn lại. Nó sẽ được cập nhật lên định dạng mới nhất trong lần lưu tiếp theo."]),
		"patternNotFound": _=>"Một số phần xếp chồng lên nhau của các nắp trong thiết kế này là hợp lệ, nhưng hiện tại BP Studio không thể tìm thấy các mẫu co giãn phù hợp cho chúng. Tác giả của ứng dụng này sẽ tiếp tục triển khai nhiều thuật toán hơn để bao gồm nhiều trường hợp hơn.",
		"unsaved": ({normalize:n,interpolate:i,list:l})=>n(["Dự án \"",i(l(0)),"\" chứa các thay đổi chưa được lưu. Hủy các thay đổi?"]),
		"updateReady": _=>"Phiên bản BP Studio mới hơn đã sẵn sàng và sẽ tự động cập nhật khi khởi động lại. Bạn có muốn khởi động lại ngay bây giờ?",
		"restartFail": _=>"Không thể khởi động lại. Vui lòng đóng tất cả các phiên bản của BP Studio.",
		"webGL": {
			"title": _=>"Khởi tạo WebGL không thành công",
			"body": _=>"BP Studio yêu cầu chạy WebGL nhưng không thể khởi tạo ngữ cảnh WebGL. Vui lòng kiểm tra cài đặt trình duyệt của bạn."
		},
		"inApp": _=>"Có vẻ như bạn đang sử dụng trình duyệt trong ứng dụng. Tải xuống có thể không hoạt động."
	},
	"plugin": {
		"TreeMaker": {
			"not5": ({normalize:n,interpolate:i,list:l})=>n(["Tệp \"",i(l(0)),"\" không có định dạng TreeMaker 5."]),
			"size8": _=>"BP Studio yêu cầu kích thước trang tính ít nhất là 8.",
			"invalid": ({normalize:n,interpolate:i,list:l})=>n(["Tệp \"",i(l(0)),"\" có vẻ như bị hỏng và không thể tải thành công."])
		},
		"optimizer": {
			"_": _=>"Tối ưu hóa bố cục",
			"options": {
				"_": _=>"Tùy chọn",
				"openNew": _=>"Hiển thị kết quả trong tab mới",
				"useDim": _=>"Giữ nguyên chiều rộng và chiều cao của các nhánh"
			},
			"layout": {
				"_": _=>"Phương pháp bố trí",
				"view": _=>"Sử dụng bố cục hiện tại làm tài liệu tham khảo",
				"random": _=>"Hãy thử bố cục ngẫu nhiên và sử dụng bố cục tốt nhất",
				"toTry": _=>"Số lượng bố cục để thử:",
				"useBH": _=>"Cũng tìm kiếm các giải pháp gần đó"
			},
			"fit": {
				"_": _=>"Phương pháp lắp",
				"quick": _=>"Chế độ nhanh",
				"full": _=>"Chế độ đầy đủ"
			},
			"skip": _=>"Nhảy",
			"run": _=>"Chạy!",
			"running": _=>"Đang chạy..."
		}
	},
	"keyword": {
		"yes": _=>"Đúng",
		"no": _=>"Không",
		"ok": _=>"OK",
		"here": _=>"đây",
		"abort": _=>"Hủy bỏ",
		"close": _=>"Đóng",
		"cancel": _=>"Hủy bỏ",
		"export": _=>"Xuất tệp",
		"delete": _=>"Xóa bỏ",
		"discord": _=>"Máy chủ BP Studio Discord",
		"version": _=>"Phiên bản",
		"filename": _=>"tên tệp",
		"download": _=>"Tải xuống",
		"homepage": _=>"trang chủ",
		"untitled": _=>"Không có tiêu đề",
		"errorLog": _=>"Tải xuống nhật ký lỗi",
		"workspace": _=>"không gian làm việc"
	}
}
,
"zh-cn": {
	"name": _=>"简体中文",
	"flag": _=>"china",
	"emoji": _=>"🇨🇳",
	"since": 900,
	"welcome": {
		"title": _=>"欢迎使用 Box Pleating Studio！",
		"intro": [
			_=>"本应用是用来帮助折纸设计者利用箱形褶（box pleating，日文作「蛇腹折り」）系统和 GOPS 来设计超复杂超狂的作品的。",
			({normalize:n,interpolate:i,list:l})=>n(["首先，您可以从左上角的菜单建立新的空白项目，或是至 ",i(l(0))," 阅读简短的指南（英文版）。"])
		],
		"install": {
			"hint": _=>"您也可以将 BP Studio 以独立应用的形式安装至您的装置上，并离线使用！",
			"ios": _=>"iOS 安装方法：在 Safari 中打开本网址，按下屏幕中间下方的分享按钮，并且点选「加入至首页」。",
			"bt": _=>"安装 Box Pleating Studio 应用",
			"prepare": _=>"正在准备安装，请稍候...",
			"ing": _=>"安装应用中，请稍待……",
			"ed": _=>"BP Studio 已经安装到您的装置上了。",
			"open": _=>"打开 Box Pleating Studio 应用"
		},
		"copyright": ({normalize:n,interpolate:i,list:l})=>n(["Copyright © 2020",i(l(0))," 蔡牧村"]),
		"recent": _=>"最近使用",
		"start": _=>"开始",
		"website": _=>"BP Studio 网站",
		"discord": ({normalize:n,interpolate:i,list:l})=>n(["请加入我们的 ",i(l(0)),"！"])
	},
	"toolbar": {
		"file": {
			"title": _=>"文件",
			"new": _=>"新建项目",
			"open": _=>"打开项目 / 工作区",
			"print": _=>"打印目前的视图",
			"share": _=>"分享目前的项目",
			"notFound": ({normalize:n,interpolate:i,list:l})=>n(["无法打开文件「",i(l(0)),"」；文件未找到。"]),
			"recent": {
				"title": _=>"打开最近的文件",
				"empty": _=>"没有记录",
				"clear": _=>"清除记录"
			},
			"BPF": _=>"BP Studio 格式",
			"BPS": {
				"name": _=>"BP Studio 项目",
				"download": _=>"下载目前的项目",
				"save": _=>"保存项目",
				"saveAs": _=>"将项目另存为...",
				"saveAll": _=>"保存所有项目"
			},
			"BPZ": {
				"name": _=>"BP Studio 工作区",
				"download": _=>"下载工作区",
				"save": _=>"将工作区另存为..."
			},
			"PNG": {
				"name": _=>"PNG 图像",
				"download": _=>"以 PNG 格式下载目前的视图",
				"save": _=>"将目前的视图保存为 PNG",
				"copy": _=>"以 PNG 格式复制目前的视图"
			},
			"SVG": {
				"name": _=>"SVG 图像",
				"download": _=>"以 SVG 格式下载目前的视图",
				"save": _=>"将目前的视图保存为 SVG"
			}
		},
		"edit": {
			"title": _=>"编辑",
			"undo": _=>"撤消",
			"redo": _=>"恢复",
			"selectAll": _=>"全选",
			"unselectAll": _=>"取消选取"
		},
		"setting": {
			"title": _=>"设置",
			"fullscreen": _=>"全屏模式",
			"fullscreenExit": _=>"退出全屏模式",
			"grid": _=>"显示格线",
			"hinge": _=>"显示枢纽折痕",
			"ridge": _=>"显示脊线折痕",
			"axial": _=>"显示装置中的轴平行折痕",
			"label": _=>"显示标签",
			"tip": _=>"显示角片顶点",
			"dPad": _=>"显示方向键",
			"status": _=>"显示状态栏",
			"preference": _=>"首选项"
		},
		"tools": {
			"title": _=>"工具",
			"TreeMaker": _=>"导入 TreeMaker 文件",
			"CP": {
				"_": _=>"导出 CP 文件",
				"reorient": _=>"若适用的话重新定向纸张"
			}
		},
		"help": {
			"title": _=>"说明",
			"about": _=>"关于",
			"news": _=>"版本资讯",
			"update": _=>"已准备更新",
			"checkUpdate": _=>"检查更新",
			"donation": _=>"捐款",
			"discussions": _=>"讨论区",
			"issue": _=>"问题反馈",
			"homepage": _=>"主页"
		},
		"view": {
			"tree": _=>"树状结构",
			"layout": _=>"布局"
		},
		"tab": {
			"clone": _=>"复制",
			"close": _=>"关闭",
			"closeAll": _=>"全部关闭",
			"closeOther": _=>"关闭其它",
			"closeRight": _=>"关闭右侧",
			"noTitle": _=>"(无标题)"
		},
		"panel": _=>"选项面板"
	},
	"preference": {
		"general": _=>"一般",
		"color": {
			"_": _=>"配色",
			"default": _=>"默认",
			"border": _=>"边线",
			"grid": _=>"格线",
			"hinge": _=>"枢纽折痕",
			"ridge": _=>"脊线折痕",
			"axisParallel": _=>"轴平行折痕",
			"overlap": _=>"重叠",
			"tip": _=>"角片顶点",
			"label": _=>"文字标签"
		},
		"hotkey": _=>"热键",
		"command": _=>"命令",
		"language": _=>"语言",
		"theme": {
			"_": _=>"主题",
			"dark": _=>"深色主题",
			"light": _=>"浅色主题",
			"system": _=>"使用系统设置"
		},
		"reset": _=>"将所有设置重置为默认值",
		"confirmReset": _=>"您确定要将所有设置重置为默认值吗？",
		"confirmKey": ({normalize:n,interpolate:i,list:l})=>n(["热键 ",i(l(0))," 已分配给命令「",i(l(1)),"」；你想更换它吗？"]),
		"autoSave": _=>"自动保存工作区",
		"includeHidden": _=>"在 SVG 输出中包含隐藏元件",
		"loadSessionOnQueue": _=>"直接打开项目文件时加载先前的会话"
	},
	"panel": {
		"design": {
			"type": _=>"Box Pleating Studio 项目",
			"title": _=>"标题",
			"titlePH": _=>"(项目标题)",
			"descriptionPH": _=>"(项目描述)",
			"tree": _=>"树状结构视图",
			"layout": _=>"布局视图",
			"width": _=>"宽度",
			"height": _=>"高度",
			"size": _=>"尺寸",
			"zoom": _=>"缩放",
			"grid": {
				"_": _=>"类型",
				"rect": _=>"矩形网格",
				"diag": _=>"对角网格"
			}
		},
		"flap": {
			"type": _=>"角片",
			"name": _=>"名称",
			"radius": _=>"半径",
			"width": _=>"宽度",
			"height": _=>"高度",
			"goto": _=>"前往顶点"
		},
		"flaps": {
			"type": _=>"角片",
			"goto": _=>"前往顶点"
		},
		"river": {
			"type": _=>"河",
			"width": _=>"宽度",
			"goto": _=>"前往边"
		},
		"rivers": {
			"type": _=>"河"
		},
		"vertex": {
			"type": _=>"顶点",
			"name": _=>"名称",
			"addLeaf": _=>"新增叶边",
			"ofLength": _=>"长度为",
			"delJoin": _=>"删除并合并端点",
			"goto": _=>"前往角片"
		},
		"vertices": {
			"type": _=>"顶点",
			"goto": _=>"前往角片"
		},
		"edge": {
			"type": _=>"边",
			"length": _=>"长度",
			"split": _=>"分割",
			"merge": _=>"融合端点",
			"goto": _=>"前往河"
		},
		"repo": {
			"type": _=>"伸展结构",
			"config": _=>"组态",
			"pattern": _=>"折痕模式",
			"onlyOne": _=>"只找到了一种折痕模式"
		}
	},
	"status": {
		"invalid": _=>"无效重叠"
	},
	"share": {
		"title": _=>"分享项目",
		"copy": _=>"复制",
		"share": _=>"分享",
		"message": ({normalize:n,interpolate:i,list:l})=>n(["快来看我用 Box Pleating Studio 设计的项目「",i(l(0)),"」！"])
	},
	"about": {
		"title": _=>"关于 Box Pleating Studio",
		"license": _=>"依 MIT 授权条款发行",
		"manual": ({normalize:n,interpolate:i,list:l})=>n(["欲参阅指南，请前往本 App 的 ",i(l(0)),"。"]),
		"feedback": ({normalize:n,interpolate:i,list:l})=>n(["欲提供意见回馈，请前往本 App 的 ",i(l(0)),"。"]),
		"repo": _=>"Github 存储库",
		"donation": ({normalize:n,interpolate:i,list:l})=>n(["BP Studio 的使用是完全免费的。若您觉得本 App 对您的折纸设计有帮助并有兴趣提供支持，欢迎您透过 ",i(l(0))," 任意捐款。"]),
		"visitBlog": ({normalize:n,interpolate:i,list:l})=>n(["您还可以访问作者的",i(l(0)),"以了解更多信息！"]),
		"blog": _=>"博客",
		"sponsor": _=>"BP Studio 荣幸地获得以下赞助："
	},
	"donate": {
		"title": _=>"赞助 Box Pleating Studio",
		"intro": _=>"感谢您考虑赞助 Box Pleating Studio！请输入任何您想捐款的数字。您可以捐美金 $1 请我喝杯咖啡，或 $10 请我吃顿饭之类的。 😄 (PayPal 手续费会在结帐时加上去)",
		"error": _=>"请输入一个数字",
		"then": _=>"然后按下底下的按钮并依指示完成捐款。",
		"wait": _=>"请等待 PayPal 完成您的交易……",
		"nextTime": _=>"下次再说",
		"thank": ({normalize:n,interpolate:i,list:l})=>n(["",i(l(0)),"，感谢您的热情捐款！"])
	},
	"message": {
		"connFail": _=>"网络连线失败；请稍后再试。",
		"downloadHint": _=>"按右键并点选「另存连结」可指定存档位置",
		"filePermission": _=>"出于安全性原因，BP Studio 需要您的授权才能访问该文件。对于每个文件，您在执行阶段中只需要授权一次。您仍要访问该文件吗？",
		"fatal": _=>"发生内部错误，项目无法进一步操作。",
		"recover": _=>"工作区将自动恢复，但错误可能会持续存在。请下载错误日志并发送给作者以诊断问题。",
		"recoverFailed": _=>"恢复失败。",
		"invalidFormat": ({normalize:n,interpolate:i,list:l})=>n(["文件「",i(l(0)),"」的格式无效。"]),
		"invalidLink": _=>"打开项目链接时发生意外错误；数据可能已损坏。",
		"latest": _=>"您已经拥有最新版本的 BP Studio。",
		"min3vertex": _=>"树状结构至少需要有三个顶点",
		"oldVersion": ({normalize:n,interpolate:i,list:l})=>n(["项目「",i(l(0)),"」是使用较旧版本的 BP Studio 产生的，部份伸展结构可能会需要重新选取。项目会在下次存档时更新为最新格式。"]),
		"patternNotFound": _=>"在当前的设计中，存在一些角片重叠是虽然有效、但目前的 BP Studio 却无法找到可行的伸展折痕模式的。本应用的作者将会持续实作更多演算法以涵盖更多情况。",
		"unsaved": ({normalize:n,interpolate:i,list:l})=>n(["项目「",i(l(0)),"」有尚未保存的变更，确定要舍弃？"]),
		"updateReady": _=>"更新版本的 BP Studio 已准备就绪，并将在重新启动时自动更新。您想要现在立刻重新启动吗？",
		"restartFail": _=>"无法重新启动。请关闭 BP Studio 的所有实例。",
		"webGL": {
			"title": _=>"WebGL 初始化失败",
			"body": _=>"BP Studio 运行需要 WebGL，但无法初始化 WebGL 环境。请检查您的浏览器设置。"
		},
		"inApp": _=>"您似乎正在使用应用内浏览器。下载功能可能无法使用。"
	},
	"plugin": {
		"TreeMaker": {
			"not5": ({normalize:n,interpolate:i,list:l})=>n(["文件「",i(l(0)),"」不是 TreeMaker 5 的格式。"]),
			"size8": _=>"BP Studio 要求纸张大小至少为 8。",
			"invalid": ({normalize:n,interpolate:i,list:l})=>n(["文件「",i(l(0)),"」似乎已损坏，无法成功读取。"])
		},
		"optimizer": {
			"_": _=>"优化布局",
			"options": {
				"_": _=>"选项",
				"openNew": _=>"在新选项卡中显示结果",
				"useDim": _=>"保持角片的宽度和高度"
			},
			"layout": {
				"_": _=>"布局方法",
				"view": _=>"使用当前布局作为参考",
				"random": _=>"尝试随机布局并使用最好的布局",
				"toTry": _=>"要尝试的布局数量：",
				"useBH": _=>"搜索附近的解答"
			},
			"fit": {
				"_": _=>"拟合方法",
				"quick": _=>"快速模式",
				"full": _=>"完整模式"
			},
			"skip": _=>"跳过",
			"run": _=>"运行！",
			"running": _=>"运行中..."
		}
	},
	"keyword": {
		"yes": _=>"是",
		"no": _=>"否",
		"ok": _=>"确定",
		"here": _=>"这里",
		"abort": _=>"中止",
		"close": _=>"关闭",
		"cancel": _=>"取消",
		"export": _=>"导出",
		"delete": _=>"删除",
		"discord": _=>"BP Studio Discord 服务器",
		"version": _=>"版本",
		"filename": _=>"文件名",
		"download": _=>"下载",
		"homepage": _=>"主页",
		"untitled": _=>"未命名",
		"errorLog": _=>"下载错误日志",
		"workspace": _=>"工作区"
	}
}
,
"zh-tw": {
	"name": _=>"正體中文",
	"flag": _=>"taiwan",
	"emoji": _=>"🇹🇼",
	"since": 0,
	"welcome": {
		"title": _=>"歡迎使用 Box Pleating Studio！",
		"intro": [
			_=>"本應用程式是用來幫助摺紙設計者利用箱形褶（box pleating，日文作「蛇腹折り」）系統和 GOPS 來設計超複雜超狂的作品的。",
			({normalize:n,interpolate:i,list:l})=>n(["首先，您可以從左上角的選單建立新的空白專案，或是至 ",i(l(0))," 閱讀簡短的使用手冊（英文版）。"])
		],
		"install": {
			"hint": _=>"您也可以將 BP Studio 以獨立應用程式的形式安裝至您的裝置上，並離線使用！",
			"ios": _=>"iOS 安裝方法：在 Safari 中開啟本網址，按下螢幕中間下方的分享按鈕，並且點選「加入至首頁」。",
			"bt": _=>"安裝 Box Pleating Studio 應用程式",
			"prepare": _=>"正在準備安裝，請稍候...",
			"ing": _=>"安裝應用程式中，請稍待……",
			"ed": _=>"BP Studio 已經安裝到您的裝置上了。",
			"open": _=>"開啟 Box Pleating Studio 應用程式"
		},
		"copyright": ({normalize:n,interpolate:i,list:l})=>n(["Copyright © 2020",i(l(0))," 蔡牧村"]),
		"recent": _=>"最近使用",
		"start": _=>"開始",
		"website": _=>"BP Studio 網站",
		"discord": ({normalize:n,interpolate:i,list:l})=>n(["請加入我們的 ",i(l(0)),"！"])
	},
	"toolbar": {
		"file": {
			"title": _=>"檔案",
			"new": _=>"開新專案",
			"open": _=>"開啟專案 / 工作區",
			"print": _=>"列印目前的視圖",
			"share": _=>"分享目前的專案",
			"notFound": ({normalize:n,interpolate:i,list:l})=>n(["無法開啟檔案「",i(l(0)),"」；找不到檔案。"]),
			"recent": {
				"title": _=>"開啟最近的檔案",
				"empty": _=>"沒有記錄",
				"clear": _=>"清除記錄"
			},
			"BPF": _=>"BP Studio 格式",
			"BPS": {
				"name": _=>"BP Studio 專案",
				"download": _=>"下載目前的專案",
				"save": _=>"儲存專案",
				"saveAs": _=>"另存專案為...",
				"saveAll": _=>"儲存所有專案"
			},
			"BPZ": {
				"name": _=>"BP Studio 工作區",
				"download": _=>"下載工作區",
				"save": _=>"將工作區另存為..."
			},
			"PNG": {
				"name": _=>"PNG 圖片",
				"download": _=>"以 PNG 格式下載目前的視圖",
				"save": _=>"將目前的視圖儲存為 PNG",
				"copy": _=>"以 PNG 格式複製目前的視圖"
			},
			"SVG": {
				"name": _=>"SVG 圖片",
				"download": _=>"以 SVG 格式下載目前的視圖",
				"save": _=>"將目前的視圖儲存為 SVG"
			}
		},
		"edit": {
			"title": _=>"編輯",
			"undo": _=>"復原",
			"redo": _=>"取消復原",
			"selectAll": _=>"全選",
			"unselectAll": _=>"取消選取"
		},
		"setting": {
			"title": _=>"設定",
			"fullscreen": _=>"全螢幕模式",
			"fullscreenExit": _=>"退出全螢幕模式",
			"grid": _=>"顯示格線",
			"hinge": _=>"顯示樞紐摺痕",
			"ridge": _=>"顯示脊摺痕",
			"axial": _=>"顯示裝置中的軸平行摺痕",
			"label": _=>"顯示標籤",
			"tip": _=>"顯示角片頂點",
			"dPad": _=>"顯示方向鍵",
			"status": _=>"顯示狀態列",
			"preference": _=>"喜好設定"
		},
		"tools": {
			"title": _=>"工具",
			"TreeMaker": _=>"匯入 TreeMaker 檔案",
			"CP": {
				"_": _=>"匯出 CP 檔案",
				"reorient": _=>"若適用的話重新定向紙張"
			}
		},
		"help": {
			"title": _=>"說明",
			"about": _=>"關於",
			"news": _=>"版本資訊",
			"update": _=>"已準備更新",
			"checkUpdate": _=>"檢查更新",
			"donation": _=>"捐款",
			"discussions": _=>"討論區",
			"issue": _=>"回報問題",
			"homepage": _=>"首頁"
		},
		"view": {
			"tree": _=>"樹狀結構",
			"layout": _=>"佈局"
		},
		"tab": {
			"clone": _=>"複製",
			"close": _=>"關閉",
			"closeAll": _=>"全部關閉",
			"closeOther": _=>"關閉其它",
			"closeRight": _=>"關閉右側",
			"noTitle": _=>"(無標題)"
		},
		"panel": _=>"選項面板"
	},
	"preference": {
		"general": _=>"一般",
		"color": {
			"_": _=>"配色",
			"default": _=>"預設",
			"border": _=>"邊線",
			"grid": _=>"格線",
			"hinge": _=>"樞紐摺痕",
			"ridge": _=>"脊線摺痕",
			"axisParallel": _=>"軸平行摺痕",
			"overlap": _=>"重疊",
			"tip": _=>"角片頂點",
			"label": _=>"文字標籤"
		},
		"hotkey": _=>"快速鍵",
		"command": _=>"指令",
		"language": _=>"語言",
		"theme": {
			"_": _=>"主題",
			"dark": _=>"深色主題",
			"light": _=>"淺色主題",
			"system": _=>"使用系統設定"
		},
		"reset": _=>"將所有設定重置為預設值",
		"confirmReset": _=>"您確定要將所有設定重置為預設值嗎？",
		"confirmKey": ({normalize:n,interpolate:i,list:l})=>n(["快速鍵 ",i(l(0))," 已分配給指令「",i(l(1)),"」；您想更換它嗎？"]),
		"autoSave": _=>"自動儲存工作區",
		"includeHidden": _=>"在 SVG 輸出中包含隱藏元件",
		"loadSessionOnQueue": _=>"直接打開專案檔案時載入之前的工作階段"
	},
	"panel": {
		"design": {
			"type": _=>"Box Pleating Studio 專案",
			"title": _=>"標題",
			"titlePH": _=>"(專案標題)",
			"descriptionPH": _=>"(專案描述)",
			"tree": _=>"樹狀結構檢視",
			"layout": _=>"佈局檢視",
			"width": _=>"寬度",
			"height": _=>"高度",
			"size": _=>"尺寸",
			"zoom": _=>"縮放",
			"grid": {
				"_": _=>"類型",
				"rect": _=>"矩形格線",
				"diag": _=>"對角格線"
			}
		},
		"flap": {
			"type": _=>"角片",
			"name": _=>"名稱",
			"radius": _=>"半徑",
			"width": _=>"寬度",
			"height": _=>"高度",
			"goto": _=>"前往頂點"
		},
		"flaps": {
			"type": _=>"角片",
			"goto": _=>"前往頂點"
		},
		"river": {
			"type": _=>"河",
			"width": _=>"寬度",
			"goto": _=>"前往邊"
		},
		"rivers": {
			"type": _=>"河"
		},
		"vertex": {
			"type": _=>"頂點",
			"name": _=>"名稱",
			"addLeaf": _=>"新增葉邊",
			"ofLength": _=>"長度為",
			"delJoin": _=>"刪除並合併端點",
			"goto": _=>"前往角片"
		},
		"vertices": {
			"type": _=>"頂點",
			"goto": _=>"前往角片"
		},
		"edge": {
			"type": _=>"邊",
			"length": _=>"長度",
			"split": _=>"分割",
			"merge": _=>"融合端點",
			"goto": _=>"前往河"
		},
		"repo": {
			"type": _=>"伸展結構",
			"config": _=>"組態",
			"pattern": _=>"摺痕模式",
			"onlyOne": _=>"只找到了一種摺痕模式"
		}
	},
	"status": {
		"invalid": _=>"無效重疊"
	},
	"share": {
		"title": _=>"分享專案",
		"copy": _=>"複製",
		"share": _=>"分享",
		"message": ({normalize:n,interpolate:i,list:l})=>n(["快來看我用 Box Pleating Studio 設計的專案「",i(l(0)),"」！"])
	},
	"about": {
		"title": _=>"關於 Box Pleating Studio",
		"license": _=>"依 MIT 授權條款發行",
		"manual": ({normalize:n,interpolate:i,list:l})=>n(["欲參閱使用手冊，請前往本 App 的 ",i(l(0)),"。"]),
		"feedback": ({normalize:n,interpolate:i,list:l})=>n(["欲提供意見回饋，請前往本 App 的 ",i(l(0)),"。"]),
		"repo": _=>"Github 儲存庫",
		"donation": ({normalize:n,interpolate:i,list:l})=>n(["BP Studio 的使用是完全免費的。若您覺得本 App 對您的摺紙設計有幫助並有興趣提供支持，歡迎您透過 ",i(l(0))," 任意捐款。"]),
		"visitBlog": ({normalize:n,interpolate:i,list:l})=>n(["您還可以參觀作者的",i(l(0)),"以了解更多資訊！"]),
		"blog": _=>"部落格",
		"sponsor": _=>"BP Studio 榮幸地獲得以下贊助："
	},
	"donate": {
		"title": _=>"贊助 Box Pleating Studio",
		"intro": _=>"感謝您考慮贊助 Box Pleating Studio！請輸入任何您想捐款的數字。您可以捐美金 $1 請我喝杯咖啡，或 $10 請我吃頓飯之類的。😄 (PayPal 手續費會在結帳時加上去)",
		"error": _=>"請輸入一個數字",
		"then": _=>"然後按下底下的按鈕並依指示完成捐款。",
		"wait": _=>"請等待 PayPal 完成您的交易……",
		"nextTime": _=>"下次再說",
		"thank": ({normalize:n,interpolate:i,list:l})=>n(["",i(l(0)),"，感謝您的熱情捐款！"])
	},
	"message": {
		"connFail": _=>"網路連線失敗；請稍後再試。",
		"downloadHint": _=>"按右鍵並點選「另存連結」可指定存檔位置",
		"filePermission": _=>"基於安全性理由，BP Studio 需要您的授權才能存取該檔案。對於每個檔案，您在執行階段中只需要授權一次。您仍要存取該檔案嗎？",
		"fatal": _=>"發生內部錯誤，專案無法進一步操作。",
		"recover": _=>"工作區將自動恢復，但錯誤可能會持續存在。請下載錯誤日誌並傳送給作者以診斷問題。",
		"recoverFailed": _=>"恢復失敗。",
		"invalidFormat": ({normalize:n,interpolate:i,list:l})=>n(["檔案「",i(l(0)),"」的格式無效。"]),
		"invalidLink": _=>"開啟專案連結時發生意外錯誤；資料可能已損壞。",
		"latest": _=>"您已經擁有最新版本的 BP Studio。",
		"min3vertex": _=>"樹狀結構至少需要有三個頂點",
		"oldVersion": ({normalize:n,interpolate:i,list:l})=>n(["專案「",i(l(0)),"」是使用較舊版本的 BP Studio 產生的，部份伸展結構可能會需要重新選取。專案會在下次存檔時更新為最新格式。"]),
		"patternNotFound": _=>"在當前的設計中，存在一些角片重疊是雖然有效、但目前的 BP Studio 卻無法找到可行的伸展摺痕模式的。本應用程式的作者將會持續實作更多演算法以涵蓋更多情況。",
		"unsaved": ({normalize:n,interpolate:i,list:l})=>n(["專案「",i(l(0)),"」有尚未儲存的變更，確定要捨棄？"]),
		"updateReady": _=>"更新版本的 BP Studio 已準備就緒，並將在重新啟動時自動更新。您想要現在立刻重新啟動嗎？",
		"restartFail": _=>"無法重新啟動。請關閉 BP Studio 的所有實體。",
		"webGL": {
			"title": _=>"WebGL 初始化失敗",
			"body": _=>"BP Studio 運行需要 WebGL，但無法初始化 WebGL 環境。請檢查您的瀏覽器設置。"
		},
		"inApp": _=>"您似乎正在使用應用程式內瀏覽器。下載功能可能無法使用。"
	},
	"plugin": {
		"TreeMaker": {
			"not5": ({normalize:n,interpolate:i,list:l})=>n(["檔案「",i(l(0)),"」不是 TreeMaker 5 的格式。"]),
			"size8": _=>"BP Studio 要求紙張大小至少為 8。",
			"invalid": ({normalize:n,interpolate:i,list:l})=>n(["檔案「",i(l(0)),"」似乎已損壞，無法成功讀取。"])
		},
		"optimizer": {
			"_": _=>"最佳化佈局",
			"options": {
				"_": _=>"選項",
				"openNew": _=>"在新分頁中顯示結果",
				"useDim": _=>"保持角片的寬度和高度"
			},
			"layout": {
				"_": _=>"佈局方法",
				"view": _=>"使用當前佈局作為參考",
				"random": _=>"嘗試隨機佈局並使用最佳的佈局",
				"toTry": _=>"要嘗試的佈局數量：",
				"useBH": _=>"搜尋附近的解答"
			},
			"fit": {
				"_": _=>"擬合方法",
				"quick": _=>"快速模式",
				"full": _=>"完整模式"
			},
			"skip": _=>"跳過",
			"run": _=>"執行！",
			"running": _=>"執行中…"
		}
	},
	"keyword": {
		"yes": _=>"是",
		"no": _=>"否",
		"ok": _=>"確定",
		"here": _=>"這裡",
		"abort": _=>"中止",
		"close": _=>"關閉",
		"cancel": _=>"取消",
		"export": _=>"匯出",
		"delete": _=>"刪除",
		"discord": _=>"BP Studio Discord 伺服器",
		"version": _=>"版本",
		"filename": _=>"檔名",
		"download": _=>"下載",
		"homepage": _=>"首頁",
		"untitled": _=>"未命名",
		"errorLog": _=>"下載錯誤紀錄",
		"workspace": _=>"工作區"
	}
}
,} as Record<string, BpsLocale>;