/**
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */
import { commands, window, Uri, ViewColumn, ExtensionContext, WebviewPanel, workspace } from 'vscode';
import * as path from 'path';
import { render } from './renderer';
import { ExtendedLangClient } from '../lang-client';
import { WebViewRPCHandler } from '../utils';
import BallerinaExtension from '../core/ballerina-extension';

let examplesPanel: WebviewPanel | undefined;

function showExamples(context: ExtensionContext, langClient: ExtendedLangClient) :void {
    if (examplesPanel) {
        return;
    }
    // Create and show a new webview
    examplesPanel = window.createWebviewPanel(
        'ballerinaExamples',
        "Ballerina Examples",
        { viewColumn: ViewColumn.One, preserveFocus: false } ,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );
    WebViewRPCHandler.create([
        {
            methodName: 'getExamples',
            handler: (args: any[]) => {
                return langClient.fetchExamples();
            }
        }], 
        examplesPanel.webview
    );
    const html = render(context, langClient);
    if (examplesPanel && html) {
        examplesPanel.webview.html = html;
    }
    
    // Handle messages from the webview
    examplesPanel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
            case 'openExample':
                const url = JSON.parse(message.url);
                const ballerinaHome = BallerinaExtension.getBallerinaHome();
                if (ballerinaHome) {
                    const folderPath = path.join(ballerinaHome, 'docs', 'examples', url);
                    const filePath = path.join(folderPath, `${url.replace(/-/g, '_')}.bal`);
                    workspace.openTextDocument(Uri.file(filePath)).then(doc => {
                        window.showTextDocument(doc);
                     }); 
                }
                break;
            default: 
        }
    });
    examplesPanel.onDidDispose(() => {
        examplesPanel = undefined;
    });
}

export function activate(context: ExtensionContext, langClient: ExtendedLangClient) {
    const examplesListRenderer = commands.registerCommand('ballerina.showExamples', () => {
        BallerinaExtension.onReady()
        .then(() => {
            const { experimental } = langClient.initializeResult!.capabilities;
            const serverProvidesExamples = experimental && experimental.examplesProvider;

            if (!serverProvidesExamples) {
                BallerinaExtension.showMessageServerMissingCapability();
                return;
            }

            showExamples(context, langClient);
        })
		.catch((e) => {
			if (!BallerinaExtension.isValidBallerinaHome()) {
				BallerinaExtension.showMessageInvalidBallerinaHome();
			} else {
				BallerinaExtension.showPluginActivationError();
			}
		});
    });
    
    context.subscriptions.push(examplesListRenderer);
}


