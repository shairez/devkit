import {
  Component,
  NgModule,
  PlatformRef,
  SchemaMetadata,
  StaticProvider,
  Type,
  ViewEncapsulation,
} from '@angular/core';
import { TestModuleMetadata } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Story } from '@storybook/angular';
import { DynamicModule } from 'ng-dynamic-component';

/**
 * Mount a component from a Storybook story.
 *
 * @param story a story in Storybook format.
 */
export function mountStory(story: Story) {
  const args = story.args;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { component, moduleMetadata } = story({ args }, { args } as any);
  mountV2(component, {
    ...moduleMetadata,
    inputs: args,
  });
}

let platformRef: PlatformRef;

export interface MountConfig {
  imports?: Type<unknown>[];
  providers?: StaticProvider[];
  inputs?: { [key: string]: unknown };
  styles?: string[];
  schemas?: SchemaMetadata[];
}

/**
 * This will replace both `mount` and `setupAndMount`.
 * @deprecated 🚧 Work in progress.
 */
export function mountV2(component: Type<unknown>, config: MountConfig = {}) {
  /* Destroy existing platform. */
  if (platformRef != null) {
    platformRef.destroy();
  }

  const ContainerModule = _createContainerModule({
    ...config,
    component,
  });
  platformRef = platformBrowserDynamic();
  platformRef.bootstrapModule(ContainerModule);
}

/**
 * Create a root module to bootstrap on.
 */
export function _createContainerModule({
  component,
  inputs = {},
  imports = [],
  providers = [],
  styles = [],
  schemas = [],
}: {
  component: Type<unknown>;
} & MountConfig) {
  /* Decorate component manually to avoid runtime error:
   *   NG0303: Can't bind to 'ngComponentOutlet' since it isn't a known property of 'ng-container'.
   * because `ContainerModule` is also bypassing AOT. */
  const ContainerComponent = Component({
    /* Make sure that styles are applied globally. */
    encapsulation: ViewEncapsulation.None,
    selector: '#root',
    styles,
    template: `<ng-container
    *ngComponentOutlet="component; ndcDynamicInputs: inputs"
  ></ng-container>`,
  })(
    class {
      component = component;
      inputs = inputs;
    }
  );

  /* Decorate module manually to avoid AOT errors like:
   *   NG1010: Value at position 1 in the NgModule.imports of ContainerModule is not a reference
   *   Value could not be determined statically..
   * as we want to be able to add imports dynamically. */
  const ContainerModule = NgModule({
    bootstrap: [ContainerComponent],
    declarations: [ContainerComponent],
    imports: [BrowserModule, DynamicModule, ...imports],
    providers,
    schemas,
  })(class {});

  return ContainerModule;
}

/**
 * @deprecated use {@link setupAndMount} instead.
 * This will be removed in 1.0.0
 *
 * @sunset 1.0.0
 */
export function mountWithConfig(
  ...args: Parameters<typeof setupAndMount>
): ReturnType<typeof setupAndMount> {
  return setupAndMount(...args);
}

export interface Config extends TestModuleMetadata {
  detectChanges?: boolean;
  styles?: string[];
}

/**
 * @todo remove this: this is just a transitional hack to mountV2.
 * @sunset 1.0.0
 */
let _legacyGlobalConfig: Config;

export function setup(config: Config) {
  _legacyGlobalConfig = config;
}

export function mount(component: Type<unknown>, config: MountConfig = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mountV2(component, { ..._legacyGlobalConfig, ...config } as any);
}

export function setupAndMount(
  component: Type<unknown>,
  config: Config & { inputs?: { [key: string]: unknown } } = {}
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mountV2(component, config as any);
}
