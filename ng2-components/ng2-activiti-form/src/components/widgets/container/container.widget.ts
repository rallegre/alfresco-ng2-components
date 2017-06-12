/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AfterViewInit, Component, OnInit } from '@angular/core';
import { WidgetComponent } from './../widget.component';
import { ContainerWidgetModel } from './container.widget.model';

declare var componentHandler: any;

@Component({
    selector: 'container-widget',
    templateUrl: './container.widget.html',
    styleUrls: ['./container.widget.css']
})
export class ContainerWidget extends WidgetComponent implements OnInit, AfterViewInit {

    content: ContainerWidgetModel;

    public onExpanderClicked(): void {
        if (this.content && this.content.isCollapsible()) {
            this.content.isExpanded = !this.content.isExpanded;
        }
    }

    public ngOnInit(): void {
        if (this.field) {
            this.content = new ContainerWidgetModel(this.field);
        }
    }

    public ngAfterViewInit(): void {
        this.setupMaterialComponents();
    }

    public setupMaterialComponents(): boolean {
        // workaround for MDL issues with dynamic components
        if (componentHandler) {
            componentHandler.upgradeAllRegistered();
            return true;
        }
        return false;
    }
}
