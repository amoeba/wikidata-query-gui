var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.QuerySamples = ( function ( $ ) {
	'use strict';

	/**
	 * QuerySamples API for the Wikibase query service
	 *
	 * @class wikibase.queryService.api.QuerySamples
	 * @license GNU GPL v2+
	 *
	 * @author Stanislav Malyshev
	 * @author Jonas Kress
	 * @constructor
	 */
	function SELF( language, settings ) {
		this._language = language;

		if ( !settings ) {
			throw new Error( 'Invalid method call: query sample settings are missing!' );
		}
		this._apiServer = settings.server;
		this._apiEndpoint = this._apiServer + settings.endpoint;
		this._pageTitle = settings.pageTitle;
		this._pageUrl = this._apiServer + settings.pagePathElement + this._pageTitle;
	}

	/**
	 * @type {string}
	 * @private
	 */
	SELF.prototype._language = null;

	/**
	 * @return {jQuery.Promise} Object taking list of example queries { title:, query: }
	 */
	SELF.prototype.getExamples = function () {
		var self = this;

		return $.ajax( {
			url: self._apiEndpoint + encodeURIComponent( self._pageTitle + '/' + self._language ) + '?redirect=false',
			dataType: 'html'
		} ).catch( function() {
			// retry without language
			return $.ajax( {
				url: self._apiEndpoint + encodeURIComponent( self._pageTitle ) + '?redirect=false',
				dataType: 'html'
			} );
		} ).then( function ( data ) {
			return self._parseHTML( data );
		} );
	};

	/**
	 * Find closest header element one higher than this one
	 *
	 * @param {Element} element Header element
	 * @return {null|Element} Header element
     * @private
     */
	SELF.prototype._findPrevHeader = function ( element ) {
		var tag = element.prop( 'tagName' );
		if ( tag[0] !== 'H' && tag[0] !== 'h' ) {
			return null;
		}
		return this._findPrev( element, 'h' + ( tag.substr( 1 ) - 1 ) );
	};

	/**
	 * Find previous element matching the selector
	 *
	 * @param {Element} element
	 * @param {string} selector
	 * @return {Element}
     * @private
     */
	SELF.prototype._findPrev = function ( element, selector ) {
		var prev = element.prev().filter( selector );
		if ( prev.length > 0 ) {
			return prev;
		}
		prev = element.prevUntil( selector ).last().prev();
		if ( prev.length > 0 ) {
			return prev;
		}
		prev = element.parent().prev().filter( selector );
		return prev;
	};

	SELF.prototype._extractTagsFromSPARQL = function ( sparql ) {
		var tags = sparql.match( /\b[QP]\d+\b/g );

		if ( !tags ) {
			return [];
		}

		return tags;
	};

	SELF.prototype._parseHTML = function ( html ) {
		var div = document.createElement( 'div' );

		div.innerHTML = html;

		// Hard-coded examples to use in place of the ones on WikiData
		var examples = [
			{
				'title': 'Top 10 vessels with the most cruises',
				'query': 'PREFIX gl: <http://schema.geolink.org/1.0/base/main#>\n\nSELECT ?name ?s COUNT(?cruise) as ?count\nWHERE {\n\t?s a gl:Vessel .\n\t?s rdfs:label ?name .\n\t?cruise gl:hasVessel ?s \n}\nORDER BY DESC(?count) LIMIT 10',
				'href': '',
				'tags': [],
				'category': ''
			}
		];

		return _.flatten( _.toArray( _.groupBy( examples, 'category' ) ) );
	};

	/**
	 * Set the language for the query samples.
	 *
	 * @param {string} language
	 */
	SELF.prototype.setLanguage = function( language ) {
		this._language = language;
	};

	/**
	 * Get the language for the query samples.
	 *
	 * @return {string} language
	 */
	SELF.prototype.getLanguage = function() {
		return this._language;
	};
	return SELF;

}( jQuery ) );
