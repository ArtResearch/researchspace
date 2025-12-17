/**
 * ResearchSpace
 * Copyright (C) 2025, PHAROS: The International Consortium of Photo Archives
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.researchspace.templates.helper;

import org.apache.commons.lang3.StringEscapeUtils;

import com.github.jknack.handlebars.Handlebars;
import com.github.jknack.handlebars.Options;

/**
 * Generic JSON helpers.
 *
 * Provides a helper to safely embed arbitrary strings as JSON string literals
 * inside HTML attributes. It performs JSON escaping and then HTML escaping,
 * and returns a quoted JSON string literal.
 *
 * Usage:
 *   [[json (urlParam "query")]]
 */
public class JsonHelperSource {

    /**
     * JSON-escape the input and return a quoted JSON string literal,
     * additionally HTML-escaped for safe inclusion in attributes.
     */
    public String json(String param0, Options options) {
        String value = param0 == null ? "" : param0;
        String jsonEscaped = "\"" + StringEscapeUtils.escapeJson(value) + "\"";
        return new Handlebars.SafeString(StringEscapeUtils.escapeHtml4(jsonEscaped)).toString();
    }
}




