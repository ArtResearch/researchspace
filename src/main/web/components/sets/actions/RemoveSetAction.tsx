/**
 * ResearchSpace
 * Copyright (C) 2020, © Trustees of the British Museum
 * Copyright (C) 2015-2019, metaphacts GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import * as React from 'react';
import { Component, Children, ReactElement, cloneElement } from 'react';
import { Button, ButtonToolbar } from 'react-bootstrap';

import {
  SetManagementContextTypes,
  SetManagementContext,
  SetViewContext,
  SetViewContextTypes,
} from '../SetManagementApi';

interface Props {
  /**
   * When component is used inside react-bootstrap dropdown, we want to close the dropdown
   * when user cancels remove action, and this onSelect function passed from the
   * parent dropdown is what we can use for that purpose.
   */
  onSelect?: () => void;
  removeFromView?: boolean;
}

interface State {
  showConfirmation?: boolean;
  isRemoving?: boolean;
}

/**
 * Removes currently active set from the system.
 *
 * This action can be used only inside <mp-set-management> component templates.
 *
 * @example <mp-set-management-action-remove-set></mp-set-management-action-remove-set>
 */
export class RemoveSetAction extends Component<Props, State> {
  public static contextTypes = { ...SetManagementContextTypes, ...SetViewContextTypes };
  context: SetManagementContext & SetViewContext;

  private confirmationRef: HTMLElement;
  constructor(props, context) {
    super(props, context);
    this.state = {
      showConfirmation: false,
      isRemoving: false,
    };
  }

  componentWillUnmount() {
    document.body.removeEventListener('click', this.handleClickOutside);
  }

  private onClick = (e) => {
    if (!this.state.showConfirmation) {
      this.setState({ showConfirmation: true });
      document.body.addEventListener('click', this.handleClickOutside);
      e.stopPropagation();
    }
  };

  private onYesClick = () => {
    this.setState({ isRemoving: true });
    
    if (this.props.removeFromView)
      this.context['mp-set-management'].removeSetFromView(this.context['mp-set-management--set-view'].getCurrentSet());
    else 
      this.context['mp-set-management'].removeSet(this.context['mp-set-management--set-view'].getCurrentSet());
  };

  private onNoClick = () => {
    this.setState({ showConfirmation: false });
    if (this.props.onSelect) {
      this.props.onSelect();
    }
  };

  /**
   * Cancel action if clicked outside of the component.
   */
  private handleClickOutside = (event) => {
    if (this.confirmationRef && !this.confirmationRef.contains(event.target)) {
      this.setState({ showConfirmation: false });
    }
  };

  public render() {
    const child = Children.only(this.props.children) as ReactElement<any>;
    const props = { onClick: this.onClick };
    if (this.state.showConfirmation) {
      return (
        <div className="remove-set-confirmation" ref={(node) => (this.confirmationRef = node)}>
          <span>Remove set?</span>
          <div>
            <Button onClick={this.onNoClick}>
              no
            </Button>
            <Button onClick={this.onYesClick}>
              {this.state.isRemoving ? '...' : 'yes'}
            </Button>
          </div>
        </div>
      );
    } else {
      return cloneElement(child, props);
    }
  }
}
export default RemoveSetAction;
