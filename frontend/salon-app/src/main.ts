import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEsCO from '@angular/common/locales/es-CO';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeEs,   'es');
registerLocaleData(localeEsCO, 'es-CO');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
