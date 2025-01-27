/**
 * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview This custom element displays a horizontal bar that consists of a Google Assisant voice button and a series of
 * suggestion chips that enable 3P site users to interact with Google Assistant.
 */

import * as closure from '../../../third_party/closure-responding-channel/closure-bundle';
import {Services} from '#service';
import {addAttributesToElement} from '#core/dom';
import {applyFillContent, isLayoutSizeDefined} from '#core/dom/layout';

export class AmpGoogleAssistantVoiceBar extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {?AssistjsConfigService} */
    this.configService_ = null;

    /** @private {?AssistjsFrameService} */
    this.frameService_ = null;
  }

  /** @override */
  buildCallback() {
    this.configService_ = Services.assistjsConfigServiceForDoc(this.element);
    this.frameService_ = Services.assistjsFrameServiceForDoc(this.element);
  }

  /** @override */
  isLayoutSupported(layout) {
    return isLayoutSizeDefined(layout);
  }

  /** @override */
  layoutCallback() {
    // Set frame URL to an embed endpoint.
    const iframe = this.win.document.createElement('iframe');
    this.configService_.getWidgetIframeUrl('voicebar').then((iframeUrl) => {
      addAttributesToElement(iframe, {
        src: iframeUrl,
        sandbox: 'allow-scripts',
      });

      // applyFillContent so that frame covers the entire component.
      applyFillContent(iframe, /* replacedContent */ true);

      this.element.appendChild(iframe);
    });

    const serviceHandlersMap = new Map();
    serviceHandlersMap.set('RuntimeService.TriggerSendTextQuery', () => {
      this.frameService_.sendTextQuery();
    });
    serviceHandlersMap.set('RuntimeService.TriggerOpenMic', () => {
      this.frameService_.openMic();
    });

    iframe.addEventListener('load', () => {
      closure.createRespondingChannel(
        iframe.contentWindow,
        this.configService_.getAssistjsServer(),
        serviceHandlersMap
      );
    });

    // Return a load promise for the frame so the runtime knows when the
    // component is ready.
    return this.loadPromise(iframe);
  }
}
