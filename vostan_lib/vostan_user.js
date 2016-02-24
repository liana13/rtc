/*
 * Vostan CMS
 * Copyright (c) 2005-2015 Instigate CJSC
 * E-mail: info@instigatedesign.com
 * 58/1 Karapet Ulnetsi St.,
 * Yerevan, 0069, Armenia
 * Tel:  +1-408-625-7509
 * +49-893-8157-1771
 * +374-60-464700
 * +374-10-248411

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {
    var config = {
        host : "api.php",
        root : 1,
        animationDelayMin : 0,
        animationDelayMax : 300,
        share: true,
        toggle: true,
        export: false,
        export_full: false,
        locales : {
            en: 'eng',
            hy: 'հայ'
        },
        defaultLang : "en",
        msg : {
            btn : {
                search : "Search",
                attachmenttag : "attachment",
                nodescount: "Total: "
            }
        },
        msg_hy : {
            btn : {
                search : "Որոնում",
                attachmenttag : "կցորդ",
                nodescount: "Ընդամենը՝ "
            }
        }
    };

    window.vostan = new window.Vostan(config);

})();
