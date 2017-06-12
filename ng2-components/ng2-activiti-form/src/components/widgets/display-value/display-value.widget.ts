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

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import * as moment from 'moment';
import { FormService } from '../../../services/form.service';
import { WidgetVisibilityService } from '../../../services/widget-visibility.service';
import { FormFieldTypes } from '../core/form-field-types';
import { NumberFieldValidator } from '../core/form-field-validator';
import { FormFieldOption } from './../core/form-field-option';
import { WidgetComponent } from './../widget.component';

@Component({
    selector: 'display-value-widget',
    templateUrl: './display-value.widget.html',
    styleUrls: ['./display-value.widget.css']
})
export class DisplayValueWidget extends WidgetComponent implements OnInit {

    @Output()
    public error: EventEmitter<any> = new EventEmitter<any>();

    public value: any;
    public fieldType: string;
    public id: any;

    // hyperlink
    public linkUrl: string;
    public linkText: string;

    // dynamic table
    public tableEditable = false;

    // upload/attach
    public hasFile: boolean = false;
    public showDocumentContent: boolean = true;

    constructor(private formService: FormService,
                private visibilityService: WidgetVisibilityService) {
        super();
    }

    public ngOnInit(): void {
        if (this.field) {
            this.value = this.field.value;
            this.visibilityService.refreshEntityVisibility(this.field);
            if (this.field.params) {
                if (this.field.params['showDocumentContent'] !== undefined) {
                    this.showDocumentContent = !!this.field.params['showDocumentContent'];
                }
                if (this.field.params['tableEditable'] !== undefined) {
                    this.tableEditable = !!this.field.params['tableEditable'];
                }

                let originalField = this.field.params['field'];
                if (originalField && originalField.type) {
                    this.fieldType = originalField.type;
                    switch (originalField.type) {
                        case FormFieldTypes.BOOLEAN:
                            this.value = this.field.value === 'true' ? true : false;
                            break;
                        case FormFieldTypes.FUNCTIONAL_GROUP:
                            if (this.field.value) {
                                this.value = this.field.value.name;
                            } else {
                                this.value = null;
                            }
                            break;
                        case FormFieldTypes.PEOPLE:
                            let model = this.field.value;
                            if (model) {
                                let displayName = `${model.firstName} ${model.lastName}`;
                                this.value = displayName.trim();
                            }
                            break;
                        case FormFieldTypes.UPLOAD:
                            let files = this.field.value || [];
                            if (files.length > 0) {
                                this.value = decodeURI(files[0].name);
                                this.id = files[0].id;
                                this.hasFile = true;
                            } else {
                                this.value = null;
                                this.hasFile = false;
                            }
                            break;
                        case FormFieldTypes.DOCUMENT:
                            const file = this.field.value;
                            if (file) {
                                this.value = decodeURI(file.name);
                                this.id = file.id;
                                this.hasFile = true;
                            } else {
                                this.value = null;
                                this.hasFile = false;
                            }
                            break;
                        case FormFieldTypes.TYPEAHEAD:
                            this.loadRestFieldValue();
                            break;
                        case FormFieldTypes.DROPDOWN:
                            if (this.field.restUrl) {
                                this.loadRestFieldValue();
                            } else {
                                this.value = this.field.hasOptions() ? this.field.getOptionName() : this.value;
                            }
                            break;
                        case FormFieldTypes.RADIO_BUTTONS:
                            if (this.field.restUrl) {
                                this.loadRestFieldValue();
                            } else {
                                this.loadRadioButtonValue();
                            }
                            break;
                        case FormFieldTypes.DATE:
                            if (this.value) {
                                let dateValue;
                                if (NumberFieldValidator.isNumber(this.value)) {
                                    dateValue = moment(this.value);
                                } else {
                                    dateValue = moment(this.value.split('T')[0], 'YYYY-M-D');
                                }
                                if (dateValue && dateValue.isValid()) {
                                    const displayFormat = this.field.dateDisplayFormat || this.field.defaultDateFormat;
                                    this.value = dateValue.format(displayFormat);
                                }
                            }
                            break;
                        case FormFieldTypes.AMOUNT:
                            if (this.value) {
                                let currency = this.field.currency || '$';
                                this.value = `${currency} ${this.field.value}`;
                            }
                            break;
                        case FormFieldTypes.HYPERLINK:
                            this.linkUrl = this.getHyperlinkUrl(this.field);
                            this.linkText = this.getHyperlinkText(this.field);
                            break;
                        default:
                            this.value = this.field.value;
                            break;
                    }
                }
            }
            this.visibilityService.refreshVisibility(this.field.form);
        }
    }

    public loadRadioButtonValue(): void {
        let options = this.field.options || [];
        let toSelect = options.find((item) => item.id === this.field.value);
        if (toSelect) {
            this.value = toSelect.name;
        } else {
            this.value = this.field.value;
        }
    }

    public loadRestFieldValue(): void {
        if (this.field.form.taskId) {
            this.getValuesByTaskId();
        } else {
            this.getValuesByProcessDefinitionId();
        }
    }

    public getValuesByProcessDefinitionId(): void {
        this.formService
            .getRestFieldValuesByProcessId(
                this.field.form.processDefinitionId,
                this.field.id
            )
            .subscribe(
                (result: FormFieldOption[]) => {
                    let options = result || [];
                    let toSelect = options.find((item) => item.id === this.field.value);
                    this.field.options = options;
                    if (toSelect) {
                        this.value = toSelect.name;
                    } else {
                        this.value = this.field.value;
                    }
                    this.visibilityService.refreshVisibility(this.field.form);
                },
                (error) => {
                    this.value = this.field.value;
                }
            );
    }

    public getValuesByTaskId(): void {
        this.formService
            .getRestFieldValues(this.field.form.taskId, this.field.id)
            .subscribe(
                (result: FormFieldOption[]) => {
                    let options = result || [];
                    let toSelect = options.find((item) => item.id === this.field.value);
                    this.field.options = options;
                    if (toSelect) {
                        this.value = toSelect.name;
                    } else {
                        this.value = this.field.value;
                    }
                    this.visibilityService.refreshVisibility(this.field.form);
                },
                (error) => {
                    this.error.emit(error);
                    this.value = this.field.value;
                }
            );
    }
}
