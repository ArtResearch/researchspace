/**
 * ResearchSpace
 * Copyright (C) 2025, PHAROS: The International Consortium of Photo Archives
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
import * as React from 'react';
import { Component } from 'platform/api/components';
import { FormControl, Button } from 'react-bootstrap';
import { Dropzone } from 'platform/components/ui/dropzone';
import { ProgressBar, ProgressState } from '../../ontodia/src/ontodia/widgets/progressBar';
import { ImageUploadService } from './ImageUploadService';
import Icon from 'platform/components/ui/icon/Icon';
import { navigateToResource } from 'platform/api/navigation';
import { ResourceLink } from 'platform/api/navigation/components';
import { Rdf } from 'platform/api/rdf';
import * as styles from './ImageSearchWithSlider.scss';

export interface SearchInputWithRedirectProps {
  /**
   * URL to redirect to when search is triggered
   */
  redirectTo: string;

  /**
   * Placeholder text for the input field
   * @default 'Enter keyword or search by image'
   */
  placeholder?: string;

  /**
   * Whether image search features should be enabled
   * @default true
   */
  withImages?: boolean;

  /**
   * Image storage identifier for uploaded images
   */
  imageStorage: string;

  /**
   * Custom css classes for the input element
   */
  className?: string;

  /**
   * Custom css styles for the input element
   */
  style?: React.CSSProperties;

  /**
   * Display mode for image search
   * - 'inline': Image search is always visible below the text input (default)
   * - 'modal': Image search is triggered by clicking an icon and shows in a modal overlay
   * @default 'inline'
   */
  mode?: 'inline' | 'modal';
}

interface State {
  value: string;
  progress: number;
  showImageSearchModal: boolean;
  imageSearchUrl: string;
  overlayPosition: 'up' | 'down';
}

class SearchInputWithRedirect extends Component<SearchInputWithRedirectProps, State> {
  private textInput: HTMLInputElement | null = null;
  private imageUploadService: ImageUploadService;
  private inputContainerRef: HTMLDivElement | null = null;
  private overlayWrapperRef: HTMLDivElement | null = null;

  static defaultProps: Partial<SearchInputWithRedirectProps> = {
    placeholder: 'Enter keyword',
    className: "input-image-search",
    withImages: true,
    mode: 'inline',
  };

  constructor(props: SearchInputWithRedirectProps, context: any) {
    super(props, context);

    this.state = {
      value: '',
      progress: 0,
      showImageSearchModal: false,
      imageSearchUrl: '',
      overlayPosition: 'down'
    };

    this.imageUploadService = new ImageUploadService();
  }

  componentDidMount() {
    if (this.props.mode === 'modal') {
      window.addEventListener('resize', this.updateOverlayPosition);
    }
  }

  componentDidUpdate(prevProps: SearchInputWithRedirectProps, prevState: State) {
    if (this.props.mode === 'modal') {
      // Update overlay position when modal opens/closes
      if (prevState.showImageSearchModal !== this.state.showImageSearchModal) {
        if (this.state.showImageSearchModal) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              this.updateOverlayPosition();
            });
          });
          // Add Esc key listener when modal opens
          window.addEventListener('keydown', this.handleEscKey);
        } else {
          // Remove Esc key listener when modal closes
          window.removeEventListener('keydown', this.handleEscKey);
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.props.mode === 'modal') {
      window.removeEventListener('resize', this.updateOverlayPosition);
      window.removeEventListener('keydown', this.handleEscKey);
    }
  }

  private updateOverlayPosition = () => {
    if (!this.overlayWrapperRef || !this.state.showImageSearchModal || !this.inputContainerRef) {
      return;
    }

    const referenceRect = this.inputContainerRef.getBoundingClientRect();
    const containerRect = this.inputContainerRef.parentElement?.getBoundingClientRect();
    
    if (!containerRect || referenceRect.width === 0) {
      return;
    }

    // Calculate available space above and below the input
    const viewportHeight = window.innerHeight;
    const spaceAbove = referenceRect.top;
    const spaceBelow = viewportHeight - referenceRect.bottom;
    
    // Get the overlay height (estimate or measure)
    const overlayHeight = this.overlayWrapperRef.offsetHeight || 300; // fallback estimate
    
    // Determine position: prefer 'down' unless there's significantly more space above
    // and not enough space below
    let position: 'up' | 'down' = 'down';
    if (spaceBelow < overlayHeight && spaceAbove > spaceBelow) {
      position = 'up';
    }
    
    // Update state if position changed
    if (this.state.overlayPosition !== position) {
      this.setState({ overlayPosition: position });
    }

    let left = referenceRect.left - containerRect.left;
    let width = referenceRect.width;

    const containerWidth = containerRect.width;
    if (left + width > containerWidth) {
      width = Math.max(containerWidth - left, 200);
    }
    
    if (left < 0) {
      left = 0;
      width = Math.min(referenceRect.width, containerWidth);
    }

    this.overlayWrapperRef.style.left = `${left}px`;
    this.overlayWrapperRef.style.width = `${width}px`;
    this.overlayWrapperRef.style.minWidth = `${width}px`;
    this.overlayWrapperRef.style.maxWidth = `${width}px`;
    
    // Position the overlay to cover the input
    // The overlay should overlap/cover the input field
    const inputTop = referenceRect.top - containerRect.top;
    const inputBottom = referenceRect.bottom - containerRect.top;
    
    if (position === 'up') {
      // Position above: align bottom of overlay with bottom of input (overlay covers input and extends up)
      this.overlayWrapperRef.style.top = 'auto';
      this.overlayWrapperRef.style.bottom = `${containerRect.height - inputBottom}px`;
      this.overlayWrapperRef.style.transform = 'none';
      this.overlayWrapperRef.style.transformOrigin = 'bottom center';
    } else {
      // Position below: align top of overlay with top of input (overlay covers input and extends down)
      this.overlayWrapperRef.style.top = `${inputTop}px`;
      this.overlayWrapperRef.style.bottom = 'auto';
      this.overlayWrapperRef.style.transform = 'none';
      this.overlayWrapperRef.style.transformOrigin = 'top center';
    }
  };

  private handleSearch = () => {
    const { redirectTo } = this.props;
    const currentValue = this.state.value;

    if (!this.isEmpty(currentValue)) {
      // Text or URL search
      this.redirectToSearch(redirectTo, { query: currentValue });
    }
  };

  private redirectToSearch = (url: string, params: Record<string, string>) => {
    navigateToResource(Rdf.iri(url), params).onValue(() => {
      // Navigation completed
    });
  };

  private isEmpty = (value: string): boolean => {
    return !value || value.trim().length === 0;
  };

  private onKeyPress = (event: React.FormEvent<FormControl>) => {
    const newValue = (event.target as any).value;
    this.setState({ value: newValue });
  };

  private handleOpenImageSearchModal = () => {
    this.setState({ showImageSearchModal: true });
  };

  private handleCloseImageSearchModal = () => {
    this.setState({ 
      showImageSearchModal: false,
      imageSearchUrl: ''
    });
  };

  private handleEscKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.state.showImageSearchModal) {
      this.handleCloseImageSearchModal();
    }
  };

  private handleImageSearchUrlChange = (event: React.FormEvent<FormControl>) => {
    const newUrl = (event.target as any).value;
    this.setState({ imageSearchUrl: newUrl });
  };

  private handleSearchFromUrl = () => {
    const { imageSearchUrl } = this.state;
    const { redirectTo, mode } = this.props;
    if (imageSearchUrl && imageSearchUrl.trim()) {
      if (mode === 'modal') {
        // Close modal when URL search is triggered in modal mode
        this.setState({
          showImageSearchModal: false,
          imageSearchUrl: ''
        });
      } else {
        this.setState({ imageSearchUrl: '' });
      }
      this.redirectToSearch(redirectTo, { query: imageSearchUrl.trim() });
    }
  };

  private handleDrop = (files: File[]) => {
    if (!this.props.withImages) {
      console.warn('Image upload is not enabled');
      return;
    }

    const { mode } = this.props;

    if (files && files.length > 0) {
      const file = files[0];
      if (mode === 'modal') {
        // Close modal when file is selected in modal mode
        this.setState({
          progress: 0,
          showImageSearchModal: false,
          imageSearchUrl: ''
        });
      } else {
        this.setState({
          progress: 0,
          imageSearchUrl: '',
        });
      }
      this.imageUploadService.uploadImage(file, this.props.imageStorage, (progress) => {
        this.setState({ progress: Math.min(progress, 99) });
      })
        .then(response => {
          // Redirect immediately after upload completes
          this.redirectToSearch(this.props.redirectTo, { file: response.fileName });
        })
        .catch(error => {
          console.error('Failed to upload image:', error);
          this.setState({ progress: 0 });
        });
    }
  };

  private renderImageSearchContent() {
    return (
      <div className={styles.imageSearchOverlayBody}>
        <Dropzone
          accept={"image/*"}
          onDropAccepted={this.handleDrop}
          className={styles.imageSearchDropzone}
        >
          <div className={styles.imageSearchDropzoneContent}>
            <Icon iconType='rounded' iconName='image' symbol className={styles.imageSearchDropzoneIcon} />
            <div className={styles.imageSearchDropzoneText}>
              <span>Drag an image here or <a>upload a file</a></span>
              <div className={styles.imageSearchDropzoneFormats}>
                Supported formats: .tiff, .jpeg, .png
              </div>
            </div>
          </div>
        </Dropzone>

        <div className={styles.imageSearchModalOr}>OR</div>

        <div className={styles.imageSearchUrlContainer}>
          <FormControl
            type="text"
            placeholder="Paste image link"
            value={this.state.imageSearchUrl}
            onChange={this.handleImageSearchUrlChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                this.handleSearchFromUrl();
              }
            }}
          />
          <Button
            className={styles.imageSearchModalSearchBtn}
            onClick={this.handleSearchFromUrl}
          >
            Search
          </Button>
        </div>
      </div>
    );
  }

  render() {
    const { placeholder, style, className, withImages, mode } = this.props;
    const { showImageSearchModal, progress } = this.state;

    const isModalMode = mode === 'modal';

    return (
      <div className={styles.imageSearchWithSlider}>
        <div className={styles.imageSearchContainer}>
          {/* Input with search icon */}
          <div 
            ref={(ref) => { this.inputContainerRef = ref; }}
            className={`${styles.inputDropzoneContainer} ${isModalMode && showImageSearchModal ? styles.inputDisabled : ''}`}
          >
            {/* Search icon on the left */}
            <Icon className={styles.searchIconLeft} iconType='rounded' iconName='search' symbol />
            
            <div className={styles.inputWithClear}>
              <FormControl
                inputRef={(ref) => { this.textInput = ref; }}
                type="search"
                className={className}
                style={style}
                value={this.state.value}
                placeholder={placeholder}
                onChange={this.onKeyPress}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    this.handleSearch();
                  }
                }}
                disabled={(isModalMode && showImageSearchModal) || progress > 0}
              />
            </div>
            
            {/* Help icon for search help */}
            {isModalMode && (
              <ResourceLink
                resource={Rdf.iri('https://artresearch.net/resource/search-help')}
                className={styles.searchHelpIcon}
                title="Search help"
              >
                <Icon 
                  iconType='rounded' 
                  iconName='help_outline' 
                  symbol 
                />
              </ResourceLink>
            )}
            
            {/* Photo icon for image search (modal mode only) */}
            {withImages && isModalMode && (
              <Icon 
                className={styles.cameraIcon} 
                iconType='rounded' 
                iconName='add_photo_alternate' 
                symbol 
                title="Search by image"
                onClick={this.handleOpenImageSearchModal} 
              />
            )}
          </div>
          
          {/* Search button outside input container */}
          <Button 
            className={styles.searchButton} 
            onClick={this.handleSearch} 
            disabled={(isModalMode && showImageSearchModal) || progress > 0}
          >
            Search
          </Button>
          
          {/* Progress bar during upload */}
          {progress > 0 && progress < 100 && (
            <div className={styles.progressContainer}>
              <ProgressBar percent={progress} state={ProgressState.loading} />
            </div>
          )}
          
          {/* Inline mode: Image search panel always visible below the text search */}
          {withImages && !isModalMode && (
            <div className={styles.imageSearchOverlay}>
              <div className={styles.imageSearchOverlayHeader}>
                <h3 className={styles.imageSearchOverlayTitle}>or search by image</h3>
              </div>
              {this.renderImageSearchContent()}
            </div>
          )}

          {/* Modal mode: Image Search In-Place Overlay */}
          {withImages && isModalMode && showImageSearchModal && (
            <div 
              ref={(ref) => { this.overlayWrapperRef = ref; }}
              className={`${styles.imageSearchOverlayWrapper} ${this.state.overlayPosition === 'up' ? styles.overlayPositionUp : styles.overlayPositionDown}`}
            >
              <div className={styles.imageSearchOverlay}>
                {/* When opening down: header at top */}
                {this.state.overlayPosition === 'down' && (
                  <div className={styles.imageSearchOverlayHeader}>
                    <h3 className={styles.imageSearchOverlayTitle}>Search by image</h3>
                    <Icon 
                      className={styles.imageSearchOverlayClose} 
                      iconType='rounded' 
                      iconName='close' 
                      symbol 
                      onClick={this.handleCloseImageSearchModal} 
                    />
                  </div>
                )}
                {this.renderImageSearchContent()}
                {/* When opening up: header at bottom */}
                {this.state.overlayPosition === 'up' && (
                  <div className={styles.imageSearchOverlayHeader}>
                    <h3 className={styles.imageSearchOverlayTitle}>Search by image</h3>
                    <Icon 
                      className={styles.imageSearchOverlayClose} 
                      iconType='rounded' 
                      iconName='close' 
                      symbol 
                      onClick={this.handleCloseImageSearchModal} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Backdrop for overlay (modal mode only) */}
        {isModalMode && showImageSearchModal && (
          <div className={styles.imageSearchOverlayBackdrop} onClick={this.handleCloseImageSearchModal} />
        )}
      </div>
    );
  }
}

export default SearchInputWithRedirect;

