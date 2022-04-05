import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Button } from '@contentful/forma-36-react-components';
import { init, locations } from 'contentful-ui-extensions-sdk';
import tokens from '@contentful/forma-36-tokens';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

export class DialogExtension extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };

  render() {
    return (
      <div style={{ margin: tokens.spacingM }}>
        <Button
          testId="close-dialog"
          buttonType="muted"
          onClick={() => {
            this.props.sdk.close('data from modal dialog');
          }}>
          Close modal
        </Button>
      </div>
    );
  }
}

export class SidebarExtension extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();
  }

  getUrl = async domain => {
    const { entry, space, locales } = this.props.sdk;
    const { slug: contentSlug, category, template } = entry.fields;


    const {
      contentType: {
        sys: { id: contentType }
      }
    } = entry.getSys();


    let path;

    if (contentType === 'blogPost') {
      const categoryId = category.getValue().sys.id;
      const sysCategory = await space.getEntry(categoryId);
      const categorySlug = sysCategory.fields.slug[locales.default];
      path = '/' + categorySlug + '/';
    } else if (contentType === 'page') {
      let parentSlug;
        if(template.getValue() === "Landingpage") {
          parentSlug ="lp";
        } else {
          const parentPage = await space.getEntries({
            'content_type': 'page',
            select: 'fields.slug',
            'fields.childPages.sys.id': entry.getSys().id
          });
          parentSlug = parentPage.items.length > 0 ? parentPage.items[0].fields.slug[locales.default] : null;

        }
      path = parentSlug ? '/' + parentSlug + '/' : '/';

    } else {
      path = '/';
    }
    return domain + path + (contentSlug && contentSlug.getValue());
  };

  onPreviewButtonClick = async domain => {
    const uri = await this.getUrl(domain);
    window.open(uri);
  };

  onUpdateButtonClick = async () => {
    const {
      sdk: { entry, space }
    } = this.props;

    const sysEntry = await space.getEntry(entry.getSys().id);
    await space.updateEntry(sysEntry).then(
      () =>
        this.props.sdk.notifier.success(
          'Site update requested. This may take a few minutes to process.'
        ),
      () => this.props.sdk.notifier.error('Site update failed!')
    );
  };

  render() {
    const {
      parameters: { installation }
    } = this.props.sdk;
    const { productionUrl, previewUrl } = installation;

    return (
      <Fragment>
        <Button
          buttonType="muted"
          icon="ExternalLink"
          isFullWidth={true}
          testId="open-dialog"
          onClick={() => this.onPreviewButtonClick(previewUrl)}>
          Open Preview
        </Button>
        <br />
        <br />
        <Button
          buttonType="muted"
          icon="ExternalLink"
          isFullWidth={true}
          testId="open-dialog"
          onClick={() => this.onPreviewButtonClick(productionUrl)}>
          Open Live
        </Button>
        <br />
        <br />
        <Button
          buttonType="muted"
          isFullWidth={true}
          testId="open-dialog"
          onClick={this.onUpdateButtonClick}>
          Update Preview
        </Button>
      </Fragment>
    );
  }
}

export const initialize = sdk => {
  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    ReactDOM.render(<DialogExtension sdk={sdk} />, document.getElementById('root'));
  } else {
    ReactDOM.render(<SidebarExtension sdk={sdk} />, document.getElementById('root'));
  }
};

init(initialize);

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
