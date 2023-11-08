import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Button, Grid, Paragraph } from '@contentful/forma-36-react-components';
import { init, locations } from 'contentful-ui-extensions-sdk';
import '@contentful/forma-36-react-components/dist/styles.css';
import './index.css';

export class SidebarExtension extends React.Component {
  static propTypes = {
    sdk: PropTypes.object.isRequired
  };

  componentDidMount() {
    this.props.sdk.window.startAutoResizer();
  }

  getCategorySlug = async (category, space, locales) => {
    const categoryId = category.getValue().sys.id;
    const sysCategory = await space.getEntry(categoryId);

    return  sysCategory.fields.slug[locales.default];
  }

  getBlogPostUrl = async (entry, space, locales, slug) => {
    const { category } = entry.fields;
    const categorySlug = await this.getCategorySlug(category, space, locales)

    return '/' + categorySlug + '/' + slug;
  }

  getLandingpageUrl(entry, slug) {
    return '/' + 'lp' + '/' + slug;
  }

  getMaklerpageUrl(entry, slug) {
    return '/' + 'fuer-makler' + '/' + slug;
  }

  getPageUrl= async (entry, space, locales, slug) => {
    const parentPage = await space.getEntries({
      'content_type': 'page',
      select: 'fields.slug',
      'fields.childPages.sys.id': entry.getSys().id
    });

    if (parentPage.items.length > 0) {
      const parentPageSlug = parentPage.items[0].fields.slug[locales.default];
      return '/' + parentPageSlug + '/' + slug;
    } else {
      return '/' + slug;
    }
  }

  onLinkButtonClick = async domain => {
    const { entry, space, locales} = this.props.sdk;
    const { template, slug } = entry.fields;
    const templateValue = template?.getValue();
    const slugValue = slug.getValue();

    const {
      contentType: {
        sys: { id: contentType }
      }
    } = entry.getSys();

    let path = null;

    if (contentType === 'blogPost') {
      path = await this.getBlogPostUrl(entry, space, locales, slugValue);
    }

    if (contentType === 'page'){
      if (templateValue === 'Landingpage') {
        path = this.getLandingpageUrl(entry, slugValue);
      } else if (templateValue === 'Makler') {
        path = this.getMaklerpageUrl(entry, slugValue);
      } else {
        path = await this.getPageUrl(entry, space, locales, slugValue);
      }
    }

    window.open(domain + path, '_blank');
  };

  onUpdateButtonClick = async () => {
    const {
      sdk: { entry, space, notifier }
    } = this.props;

    const sysEntry = await space.getEntry(entry.getSys().id);
    await space.updateEntry(sysEntry).then(
      () =>
        notifier.success(
          'Site update requested. This may take a few minutes to process.'
        ),
      () => notifier.error('Site update failed!')
    );
  };

  render() {
    const { sdk } = this.props
    const { productionUrl, previewUrl } = sdk.parameters.installation;
    const { slug } = sdk.entry.fields;
    const buttonProps = {
      buttonType: 'muted',
      disabled: !slug.getValue(),
      isFullWidth: true
    };

    if(!productionUrl || !previewUrl) {
      return <Paragraph style={{color: "#7f0010"}}>Please configure the extension parameters in contentful</Paragraph>;
    }

    return (
        <Grid rowGap="spacingXs">
          {!slug.getValue() &&
            <Paragraph style={{color: "#7f0010"}}>
              Please define a slug to use the preview.
            </Paragraph>
          }

          <Button
            {...buttonProps}
            testId="open-preview-url"
            icon = "ExternalLink"
            onClick={() => this.onLinkButtonClick(previewUrl)}>
            Open Preview
          </Button>
          <Button
            {...buttonProps}
            testId="open-production-url"
            icon = "ExternalLink"
            onClick={() => this.onLinkButtonClick(productionUrl)}>
            Open Live
          </Button>
          <Button
            {...buttonProps}
            testId="update-preview"
            onClick={this.onUpdateButtonClick}>
            Update Preview
          </Button>
        </Grid>
    );
  }

}

export const initialize = sdk => {
  if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
    ReactDOM.render(<SidebarExtension sdk={sdk} />, document.getElementById('root'));
  }
};

init(initialize);
